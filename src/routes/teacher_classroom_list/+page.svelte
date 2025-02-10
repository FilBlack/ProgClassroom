<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"

    interface Classroom {
        id: number;
        name: string;
        studentsCount: number;
    }

    function fetchClassroomsByTeacher(): Promise<Classroom[] | { error: string }> {
        return fetch('/getClassroomsByTeacher')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => data)
            .catch(error => {
                console.error('Error fetching classrooms:', error);
                return { error: 'Failed to fetch classrooms' };
            });
        }

    let classrooms : Classroom[]
    fetchClassroomsByTeacher().then(classroom_data => {
        if (!('error' in classroom_data)) {
            classrooms = classroom_data
        } else {
            console.log("Error fetching classrooms")
        }
    })
    
    function classroomRedirect(classroom_id: string) {
        sessionStorage.setItem('currentClassroom', classroom_id);
        window.location.href = 'teacher_classroom'
    }
</script>
<Header />

{#each classrooms as room, i}
    <button onclick={classroomRedirect}>{room.name}</button>
{/each}

<Footer />