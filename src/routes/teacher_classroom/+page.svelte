<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"


    interface ProgUser {
            id: number,
            googleId: string,
            name: string ,
            email: string,
            profilePicture: string,
            position: string,
    }

    let currentClassroom: string = sessionStorage.getItem('currentClassroom')
    function fetchStudentsByClassroom(): Promise<ProgUser[] | { error: string }> {
        return fetch(`/getStudentsByClassroom?classroomId=${currentClassroom}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => data)
            .catch(error => {
                console.error('Error fetching students by classroom:', error);
                return { error: 'Failed to fetch students by classroom' };
            });
        }

    let students : ProgUser[]
    fetchStudentsByClassroom().then(student_data => {
        if (!('error' in student_data)) {
            students = student_data
        } else {
            console.log("Error fetching students by classroom")
        }
    })

    let StudentAddMessageActive: boolean = false

    function AddStudents(studentString:string) {
        const studentList: string[] = studentString.split(';').map(item => item.trim())
        //Get the classroom id from session
        const currentClassroom = sessionStorage.getItem("currentClassroom")
        fetch('/addStudentsToClassroom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ studentList: studentList, currentClassroom:currentClassroom})
        })
        .then(response => response.json())
        .then(data => {
            // Now enable the success message for a few seconds
            StudentAddMessageActive = true
            setTimeout(() => {
                StudentAddMessageActive = false;
            }, 3000);})
        .catch(error => console.error('Error:', error));

    }
</script>
<Header />


<h1> People</h1>
{#each students as student,index}
    {student.name}
    {student.id}
{/each}

<label for="AddStudent">Add Students (delimetered by ;)</label>
<textarea name="AddStudent" id="AddStudent"></textarea>
<button id="AddStudentButton">Add</button>

{#if (StudentAddMessageActive)}
    The users have been added
{/if}



<Footer />