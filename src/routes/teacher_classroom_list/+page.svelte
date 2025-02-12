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

    onMount(async () => {
        classrooms = await getClassrooms();
        console.log(classrooms);
    });
    
    function classroomRedirect(classroom_id: string) {
        sessionStorage.setItem('currentClassroom', classroom_id);
        window.location.href = 'teacher_classroom'
    }

    let ClassroomAddMessageActive: boolean = $state(false)

    async function AddClassroom() {
        const classroomStringElement = document.getElementById('AddClassroom')
        if (classroomStringElement instanceof HTMLInputElement) {
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
<Header />

Your classrooms: 

{#each classrooms as room, i}
    <button onclick={() => classroomRedirect(String(room.id))}>{room.name}</button>
    <button id={room.name +"remove"} onclick={() => removeClassroom(room)}>remove classroom</button>
{/each}



<label for="AddClassroom">Add Classroom</label>
<input type="text" name="AddClassroom" id="AddClassroom">
<button id="AddClassroomtButton" onclick={AddClassroom}>Add</button>

{#if (ClassroomAddMessageActive)}
    The classroom has been added
{/if}

<Footer />