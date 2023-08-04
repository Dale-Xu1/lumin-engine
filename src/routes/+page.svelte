<script lang="ts">
import Renderer from "../lib/test/Renderer.svelte"
import Main from "../lib/Main.svelte"

</script>

<!-- <Main /> -->
<Renderer />
<style>
:global(*)
{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:global(body)
{
    overflow: hidden;
}

</style>
