<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount } from 'svelte'


    // Define the neccessary interfaces for typescript 
    interface Classroom {
        id: number;
        name: string;
        studentsCount: number;
    }

    // Stores all the classrooms that the teacher has 
    let classrooms: Classroom[] = $state([])
    // Get all the classrooms that the teacher is part of 
    async function getClassrooms(): Promise<Classroom[] | null> {
        try {
            const response = await fetch('/getClassroomsByTeacher');
            if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            const classroomData = await response.json();
            return !('error' in classroomData) ? classroomData : null;
        } catch (error) {
            console.error('Error fetching classrooms:', error);
            throw new Error('Failed to fetch classrooms');
        }
    }

    // After the components have been mounted, get the classrooms and update the store
    onMount(async () => {
        classrooms = await getClassrooms();
    });
    
    // Redirect to the classroom that the teacher has selected
    function classroomRedirect(classroom_id: string): void {
        sessionStorage.setItem('currentClassroom', classroom_id);
        window.location.href = 'teacher_classroom'
    }

    // Whether the classroom added success message should be displayed or not
    let ClassroomAddMessageActive: boolean = $state(false)

    // Add the classroom by its name
    async function AddClassroom() {
        // Classroom name
        const classroomStringElement:HTMLInputElement  = document.getElementById('AddClassroom') as HTMLInputElement
        if (classroomStringElement) {
            fetch('/addClassroom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({classroomString: classroomStringElement.value})
            })
            .then(response => {console.log(response)
                response.json()})
            .then(async (data) =>  {
                // Now enable the success message for a few seconds
                // Also update the classroom list instantly
                classrooms = await getClassrooms();
                console.log(classrooms);
                ClassroomAddMessageActive = true
                setTimeout(() => {
                    ClassroomAddMessageActive = false;
                }, 3000);
                classroomStringElement.value = ""
            })
            .catch(error => console.error('Error:', error));
        }
    }
    // Remove the classroom through its corresponding classroom remove button
    async function removeClassroom(room: Classroom) {
        if (confirm(`Are you sure you want to delete ${room.name}?`)) {
            fetch('/removeClassroom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({classroomId: room.id})
            })
            .then(response => {
                console.log(response)
                return response.json()
            })
            .then(async (data) =>  {
                classrooms = await getClassrooms();
            })
            .catch(error => console.error('Error:', error));
        }
    }

</script>
<Header 
classroomRedirect="/teacher_classroom_list"
>
</Header>


<div id="your_classrooms">
    Your classrooms: 
</div>

<div id="classroom_list">
    {#each classrooms as room, i}
        <div class="classroom">
            <button class="classroom_name" onclick={() => classroomRedirect(String(room.id))}>{room.name}</button>
            <button class="delete_button" id={room.name +"remove"} onclick={() => removeClassroom(room)}>remove</button>
        </div>
    {/each}
</div>


<div id="classroom_add_section">
    <div id="Add_wraper">
        <label for="AddClassroom">Add Classroom: </label>
        <input type="text" name="AddClassroom" id="AddClassroom">
        <button id="AddClassroomButton" onclick={AddClassroom}>Add</button>
    </div>
    {#if (ClassroomAddMessageActive)}
        The classroom has been added!
    {/if}
</div>


<Footer />

<style>
    #classroom_list {
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
    }
    .classroom {
        display: flex;
        flex-direction: row;
        margin-bottom: 1em;
    }
    .classroom_name {
        margin: 0 2em 0 1.5em;
        width: 10em;
        text-align: left;
    }
    .classroom_name:hover {
        color: blue
    }

    .delete_button {
        width: 6em;
        border: 1px solid rgb(0,0,0,0.2);
        border-radius: 10px;
        box-sizing: content-box;
        box-shadow: 3px 2px 10px -2px rgba(0, 0, 0, 0.34);
    }
    .delete_button:hover {
        color: red;
    }
    .delete_button:active {
        transform: scale(0.98);
        box-shadow: 2px 1px 5px 1px rgba(0, 0, 0, 0.14);
    }

    #your_classrooms {
        margin-left: 1em;
        margin-bottom: 1em;
        font-size: 1.5em;
    }
    
    #classroom_add_section {
        margin-top: 3em;
        display:flex;
        flex-direction: column;
        margin-bottom: 4em;
        margin-left: 1.5em;
    }

    #AddClassroom {
        border: solid 2px rgba(0, 0, 0, 0.5);
        border-radius: 12px;
        padding: 5px;
        padding-left: 10px;

    }

    #AddClassroomButton:active  {
        transform: scale(0.98);
        box-shadow: 2px 1px 5px 1px rgba(0, 0, 0, 0.14);
    }

    #AddClassroomButton:hover{
        border: 1px solid rgba(0, 0, 255, 0.2);
        color: blue;
    }

    #AddClassroomButton {
        width: 4em;
        text-align: center;
        border: 1px solid rgb(0,0,0,0.2);
        border-radius: 10px;
        box-sizing: content-box;
        box-shadow: 3px 2px 10px -2px rgba(0, 0, 0, 0.34);
    }

    .classroom_name {
        width: 10em;
        margin-right: 4em;
        text-align: center;
        border: 1px solid rgb(0,0,0,0.2);
        border-radius: 10px;
        box-sizing: content-box;
        box-shadow: 3px 2px 10px -2px rgba(0, 0, 0, 0.34);
    }

    .classroom_name:active {
        transform: scale(0.98);
        box-shadow: 2px 1px 5px 1px rgba(0, 0, 0, 0.14);
    }

    .classroom_name:hover {
        border: 1px solid rgba(0, 0, 255, 0.2);
        color: blue;
    }
</style>