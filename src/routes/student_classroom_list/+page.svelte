<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount } from 'svelte'

    interface Classroom {
        id: number;
        name: string;
        studentsCount: number;
    }

    let classrooms: Classroom[] = $state([])
    async function getClassrooms() {
    try {
        const response = await fetch('/getClassroomsByStudent');
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const classroomData = await response.json();

        return !('error' in classroomData) ? classroomData : null;
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        throw new Error('Failed to fetch classrooms' );
    }
    }

    onMount(async () => {
        classrooms = await getClassrooms();
        console.log(classrooms);
    });
    
    function classroomRedirect(classroom_id: string) {
        sessionStorage.setItem('currentClassroom', classroom_id);
        window.location.href = 'student_classroom'
    }

</script>
<Header
classroomRedirect="/student_classroom_list"
>
</Header>
<div id="your_classrooms_tag">Your classrooms:</div>
<div id="classroom_wrapper">
    {#each classrooms as room, i}
        <button class="classroom" onclick={() => classroomRedirect(String(room.id))}>{room.name}</button>
    {/each}
</div>



<Footer />

<style>
    #your_classrooms_tag {
        font-size:30px;
        margin-left: 1em;
    }
    #classroom_wrapper {
        display: flex;
        flex-direction: column;
    }
    .classroom {
        text-align: left;
        margin-left: 2em;
    }
    .classroom:hover {
        color: blue;
    }
</style>