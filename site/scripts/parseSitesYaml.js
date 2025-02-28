/* eslint-disable no-console */
/* This file parses sites.yml, fetches GH metadata like contributors and start count for each
site and writes the results to site/src/sites.yml. */

import 'dotenv/config'
import fs from 'fs'
import yaml from 'js-yaml'
import fetch from 'node-fetch'
import { basename } from 'path'
import { performance } from 'perf_hooks'
import { rootDir, titleToSlug } from './index.js'

const inPath = `${rootDir}/sites.yml`
const outPath = `${rootDir}/site/src/sites.yml`
const updateExisting = process.argv[2] === `update-existing`

const sites = yaml.load(fs.readFileSync(inPath))
const oldSites = fs.existsSync(outPath)
  ? yaml.load(fs.readFileSync(outPath))
  : []

const start = performance.now()

const prevIds = oldSites.map((site) => site.id)

let [seenSlugs, skippedSites] = [new Set(), {}]

const headers = {
  authorization: `token ${process.env.GH_TOKEN}`,
}

function normalizeUrl(url) {
  if (!url) return null
  if (url.startsWith(`http`)) return url.replace(`http://`, `https://`)
  return `https://${url}`
}

// Only update site/src/sites.js if a new site was added to sites.yml
// or repo star counts were last fetched more than a month ago.
for (const site of sites) {
  const slug = titleToSlug(site.title)

  if (seenSlugs.has(slug)) throw new Error(`Duplicate slug ${slug}`)
  else seenSlugs.add(slug)

  site.slug = slug

  if (!site.repo || (prevIds.includes(site.id) && !updateExisting)) {
    skippedSites[site.id] = slug
    continue
  }

  const repoHandle = site.repo.split(`github.com/`)[1]
  if (repoHandle.split(`/`).length !== 2) {
    console.error(`bad repo handle ${repoHandle}`)
    skippedSites[site.id] = slug
    continue
  }
  let response = await fetch(`https://api.github.com/repos/${repoHandle}`, {
    headers,
  })
  let json = await response.json()
  site.repoStars = json.stargazers_count

  let contributors = await fetch(
    `https://api.github.com/repos/${repoHandle}/contributors`,
    { headers }
  ).then((res) => res.json())

  contributors = contributors.filter((c) => c.contributions > 10).slice(0, 5)

  contributors = await Promise.all(
    contributors.map(({ url }) => fetch(url, { headers }).then((r) => r.json()))
  )

  site.contributors = contributors.map(({ name, location, company, ...c }) => ({
    github: c.login,
    twitter: c.twitter_username,
    url: normalizeUrl(c.blog),
    avatar: c.avatar_url,
    name,
    location,
    company,
  }))
}

const newSites = sites.map((site, idx) => ({
  ...(oldSites[idx] ?? {}),
  ...site,
}))

const thisFile = basename(process.argv[1])
const comment = `# auto-generated by ${thisFile}\n`
fs.writeFileSync(outPath, comment + yaml.dump(newSites))

const wallTime = ((performance.now() - start) / 1000).toFixed(2)
console.log(
  `${thisFile} took ${wallTime}s, went through ${sites.length} sites, skipped ${
    Object.keys(skippedSites).length
  } sites`
)
