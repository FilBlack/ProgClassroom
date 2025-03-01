<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount } from 'svelte'

    // Define the neccesary interfaces for typescript
    interface Classroom {
        id: number;
        name: string;
        studentsCount: number;
    }

    // All the classroom that the student is enrolled in 
    let classrooms: Classroom[] = $state([])
    async function getClassrooms() : Promise<Classroom[] | null> {
        try {
            const response: Response = await fetch('/getClassroomsByStudent');
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            const classroomData : Classroom[] | {error:string} = await response.json();

            return !('error' in classroomData) ? classroomData : null;
        } catch (error) {
            console.error('Error fetching classrooms:', error);
            throw new Error('Failed to fetch classrooms' );
        }
    }
    // Runs when components are mounted
    onMount(async () => {
        classrooms = await getClassrooms();
    });
    
    // Redirect to the classroom that the student has selected
    function classroomRedirect(classroom_id: string): void {
        // Save the current classroom in the session storage for later use
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
        margin-bottom: 1em;
    }
    #classroom_wrapper {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
    }
    .classroom {
        text-align: center;
        margin-left: 2em;
        margin-bottom: 1em;
        width: 12em;
        border: 1px solid rgb(0,0,0,0.2);
        border-radius: 10px;
        padding: 40px 20px 40px 20px; 
        box-sizing: content-box;
        box-shadow: 3px 2px 10px -2px rgba(0, 0, 0, 0.34);
        line-height: 0.9em;
    }

    .classroom:active {
        transform: scale(0.98);
        box-shadow: 2px 1px 5px 1px rgba(0, 0, 0, 0.14);
    }

    .classroom:hover {
        border: 1px solid rgba(0, 0, 255, 0.2);
        color: blue;
    }
</style>