<script lang="ts">
  import SiteDetails from '../components/SiteDetails.svelte'
  import { Site } from '../types'
  export let site: Site
</script>

<a href="/" class="back" sveltekit:prefetch>&laquo; back</a>
<SiteDetails {site} />

<style>
  a {
    background: rgba(255, 255, 255, 0.2);
    padding: 4pt 1ex;
    border-radius: 4pt;
    margin: 2pt;
    transition: color 0.3s, background-color 0.3s;
  }
  a:hover {
    background: rgba(255, 255, 255, 0.4);
  }
  a.back {
    font-size: 3ex;
    position: absolute;
    top: 2em;
    left: 2em;
  }
</style>
