<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import {currentClassroom} from "../../lib/sharedvars.svelte.js"

</script>
<Header />

<button onclick={() => currentClassroom.classroom_id="full"}>change</button>
{currentClassroom.classroom_id}



<Footer />