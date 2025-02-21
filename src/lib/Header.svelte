<script lang="ts">
    
    import { onMount } from 'svelte';
    export let returnPage: string;
    export let classroomRedirect: string;
    let isRoot = false;
    let _mounted:boolean = false
    onMount(() => {
        isRoot = window.location.pathname === "/";
        console.log(returnPage, classroomRedirect);
        _mounted = true
    });
</script>



{#if _mounted}

<!-- Return Button image -->
 <a href={returnPage}>Back</a>

<!-- Classrooms list -->
{#if !isRoot}
    <a href={classroomRedirect}>Home</a>
{/if}
<!-- Sign out button -->
 <a href="/">Sign out</a>

<br>

{/if}
<style>

</style>

