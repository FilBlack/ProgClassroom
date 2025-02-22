<script lang="ts">
    
    import { onMount } from 'svelte';
    export let classroomRedirect: string;
    let isRoot = false;
    let _mounted:boolean = false
    onMount(() => {
        isRoot = window.location.pathname === "/";
        _mounted = true
    });
</script>



{#if _mounted}

<div id=header_container>
    
    <!-- Classrooms list -->
    {#if !isRoot}
    <div id="home_div">
        <a id="home"  href={classroomRedirect}>Home</a>
    </div>
    {:else}
        <div id="home_div">
        </div>
    {/if}
    
    <!-- Return Button image
    <div id="back_div">
        <a id="back" href={returnPage}>Back</a>
    </div> -->
    
    <!-- Sign out button -->
    <div id=sign_out_div>
        <a id="sign_out" href="/">Sign out</a>
    </div>

</div>

<br>

{/if}
<style>
#header_container {
    display: flex;
    flex-wrap: nowrap;
    /* justify-content: space-between; */
    height: 3vh;
}

#home_div, #sign_out_div{
    margin-left: 10px;
    margin-right: 10px;
}

#home_div {
    flex-grow: 1
}

</style>

