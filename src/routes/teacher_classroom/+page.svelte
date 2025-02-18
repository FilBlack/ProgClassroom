<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount } from 'svelte'
    import flatpickr from 'flatpickr';
    import 'flatpickr/dist/flatpickr.css';

    let datepicker: HTMLElement;
    let selectedDateTime: null | string = null; 
    onMount(() => {
        flatpickr(datepicker, {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            onChange: (selectedDates, dateStr, instance) => {
            if (selectedDates.length > 0) {
                selectedDateTime = selectedDates[0].toISOString();
            }
            }
        });
    });

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
    async function removeStudent(student: ProgUser) {
        if (confirm(`Are you sure you want to remove ${student.name}?`)) {
            const currentClassroom = Number(sessionStorage.getItem('currentClassroom'));
            fetch('/removeStudentFromClassroom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({classroomId: currentClassroom, studentEmail: student.email, studentId: student.googleId})
            })
            .then(response => {
                console.log(response)
                return response.json()
            })
            .then(async (data) =>  {
                fetchStudentsByClassroom(currentClassroom)
            })
            .catch(error => console.error('Error:', error));
        }
    }

    //Quiz section 
    interface Quiz {
            id: number,
            f_classroom_id: number,
            name: string ,
            question: string,
            open: boolean,
            closeAt: string,
            max_points: number,
            type: 'plaintext' | 'code',
    }
    
    let quizes: Quiz[] = $state();

    onMount(() => {
    const currentClassroom = Number(sessionStorage.getItem('currentClassroom'));
    if (!currentClassroom) {
        console.error('No currentClassroom found in sessionStorage.');
        return;
    } else {
        fetchQuizesByClassroom(currentClassroom)
    }
    })
    function fetchQuizesByClassroom(currentClassroom:number): void {
        fetch(`/getQuizesByClassroom?classroomId=${currentClassroom}`)
            .then(response => {
                if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(quiz_data => {
                    quizes = quiz_data;
            }).catch(error => {
                console.error('Error fetching students by classroom:', error);
            })
        }
    
    let quizAddMessageActive: boolean = $state(false)

    function AddQuiz() { 
        const quizNameTextArea = document.getElementById("AddQuizName") as HTMLTextAreaElement
        const quizQuestionTextArea = document.getElementById("AddQuizQuestion") as HTMLTextAreaElement
        const selectedModeElement = document.querySelector('input[name="quizType"]:checked') as HTMLInputElement
        const selectedMaxPointsElement = document.getElementById('quizMaxPoints') as HTMLInputElement
        //Get the classroom id from session
        const currentClassroom = sessionStorage.getItem("currentClassroom")
        fetch('/addQuizToClassroom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                quizName: quizNameTextArea.value,
                quizQuestion: quizQuestionTextArea.value,
                quizType: selectedModeElement.value,
                currentClassroom:currentClassroom,
                closeAt: selectedDateTime,
                maxPoints: selectedMaxPointsElement.value
            })
        })
        .then(response => response.json())
        .then((data) => {
            // Now enable the success message for a few seconds
            quizAddMessageActive = true
            quizNameTextArea.value = ""
            quizQuestionTextArea.value = ""
            fetchQuizesByClassroom(Number(currentClassroom))
            setTimeout(() => {
                quizAddMessageActive = false;
            }, 3000);})
        .catch(error => console.error('Error:', error));
    }
    async function removeQuiz(quiz: Quiz) {
        if (confirm(`Are you sure you want to remove ${quiz.name}?`)) {
            const currentClassroom = Number(sessionStorage.getItem('currentClassroom'));
            fetch('/removeQuiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({quizId: quiz.id})
            })
            .then(response => {
                console.log(response)
                return response.json()
            })
            .then(async (data) =>  {
                fetchQuizesByClassroom(currentClassroom)
            })
            .catch(error => console.error('Error:', error));
        }
    }

    async function closeQuiz(quiz: Quiz) {
        if (confirm(`Are you sure you want to close ${quiz.name}?`)) {
            const currentClassroom = Number(sessionStorage.getItem('currentClassroom'));
            fetch('/closeQuiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({quizId: quiz.id})
            })
            .then(response => {
                console.log(response)
                return response.json()
            })
            .then(async (data) =>  {
                fetchQuizesByClassroom(currentClassroom)
            })
            .catch(error => console.error('Error:', error));
        }
    }

    function formatCloseAt(ISO: string): string {
        const date = new Date(ISO);
        
        // Check if the ISO string is a valid date
        if (isNaN(date.getTime())) {
            return "Invalid date";
        }

        // "Month Day, Year, Hour:Minute AM/PM"
        return date.toLocaleString("cs-CZ", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });
    }

    function teacherQuizRedirect(quiz: Quiz) {
        sessionStorage.setItem('currentQuiz', String(quiz.id));
        window.location.href = 'teacher_classroom_quiz'
    }
</script>
<Header />


<h1> People</h1>
{#each students as student,index}
    <student id={"student" + index}>
        {student.name}|{student.email}
        <button onclick={() => removeStudent(student)}>remove</button>
    </student>
{/each}

<div>Add Students</div>
<label for="AddStudent">Email addresses: (delimetered by ;)</label>
<textarea name="AddStudent" id="AddStudent"></textarea>
<button id="AddStudentButton" onclick={AddStudents}>Add</button>
{#if (StudentAddMessageActive)}
    The users have been added
{/if}
<br>
<br>
<br>
<h1>Quizes</h1>
{#each quizes as quiz,index}
    <student id={"quiz" + index}>
        <button onclick={() => teacherQuizRedirect(quiz)}>{quiz.name}</button>
        {#if quiz.open}
            Closes at: {formatCloseAt(quiz.closeAt)}
            <button onclick={() => closeQuiz(quiz)}>close </button>
        {:else}
            Closed
        {/if}
        
        <button onclick={() => removeQuiz(quiz)}>remove</button>
    </student>
{/each}

<div>Add a quiz</div>
<label for="AddQuizName">Name:</label>
<textarea name="AddQuizName" id="AddQuizName"></textarea>
<label for="AddQuizQuestion">Question:</label>
<textarea name="AddQuizQuestion" id="AddQuizQuestion"></textarea>
<label>
    <input type="radio" name="quizType" value="plaintext" checked>
    Plaintext
</label>
<label>
    <input type="radio" name="quizType" value="code">
    Code
</label>
<label for="quizMaxPoints">Max points:</label>
<input id="quizMaxPoints" name="quizMaxPoints" type="number">
<input bind:this={datepicker} type="text" placeholder="Select the closing time">
<button id="AddQuizButton" onclick={AddQuiz}>Add</button>






<Footer />