<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount } from 'svelte'

    interface ProgUser {
            id: number,
            googleId: string,
            name: string ,
            email: string,
            profilePicture: string,
            position: string,
    }
    
    let students: ProgUser[] = $state();

    onMount(() => {
    const currentClassroom = Number(sessionStorage.getItem('currentClassroom'));
    if (!currentClassroom) {
        console.error('No currentClassroom found in sessionStorage.');
        return;
    } else {
        fetchStudentsByClassroom(currentClassroom)
    }
    })
    function fetchStudentsByClassroom(currentClassroom:number): void {
        fetch(`/getStudentsByClassroom?classroomId=${currentClassroom}`)
            .then(response => {
                if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(student_data => {
                    students = student_data;
            }).catch(error => {
                console.error('Error fetching students by classroom:', error);
            })
        }
    
    let StudentAddMessageActive: boolean = $state(false)

    function AddStudents() {
        const studentTextArea = document.getElementById("AddStudent") as HTMLTextAreaElement
        const studentString:string = studentTextArea.value
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
        .then((data) => {
            // Now enable the success message for a few seconds
            StudentAddMessageActive = true
            studentTextArea.value = ""
            fetchStudentsByClassroom(Number(currentClassroom))
            setTimeout(() => {
                StudentAddMessageActive = false;
            }, 3000);})
        .catch(error => console.error('Error:', error));
    }

</script>
<Header />


<h1> People</h1>
{#each students as student,index}
    {student.name} {student.email}
{/each}

<label for="AddStudent">Add Students (delimetered by ;)</label>
<textarea name="AddStudent" id="AddStudent"></textarea>
<button id="AddStudentButton" onclick={AddStudents}>Add</button>

{#if (StudentAddMessageActive)}
    The users have been added
{/if}



<Footer />