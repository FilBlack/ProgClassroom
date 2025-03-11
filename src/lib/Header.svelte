<script lang="ts">
    import { onMount } from 'svelte';
  
    /**
     * The home URL changes based on the user's position, so it is passed as a prop.
     */
    export let classroomRedirect: string;
  
    /**
     * Indicates if the current path is the root directory.
     */
    let isRoot: boolean = false;
  
    /**
     * Flag indicating if all the components have mounted.
     */
    let _mounted: boolean = false;
  
    onMount(() => {
      // Set isRoot to true if the current path is "/"
      isRoot = window.location.pathname === "/";
      // Mark the component as mounted.
      _mounted = true;
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
    height: em;
    box-shadow: 0 0 5px rgba(0,0,0,0.5);
}

#home_div, #sign_out_div{
    margin-left: 1em;
    margin-right: 1em;
}


#home_div:hover, #sign_out_div:hover {
    color: green
}

#home_div {
    flex-grow: 1
}

* {
    font-size: 30px
}
</style>

