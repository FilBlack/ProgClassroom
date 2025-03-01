<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount } from 'svelte'
    import flatpickr from 'flatpickr';
    import 'flatpickr/dist/flatpickr.css';

    // Initialize the flatpick, so that the teacher can choose th closing time 
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
    
    // Define the neccessary interfaces for typescript 
    interface ProgUser {
            id: number,
            googleId: string,
            name: string ,
            email: string,
            profilePicture: string,
            position: string,
    }

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
    
    // Students in the classroom state
    let students: ProgUser[] = $state();

    onMount(() => {
        // After all components are mounted we try and get all the students that belong to the classroom if we find the classroom id
        const currentClassroom: number = Number(sessionStorage.getItem('currentClassroom'));
        if (!currentClassroom) {
            console.error('No currentClassroom found in sessionStorage.');
            return;
        } else {
            fetchStudentsByClassroom(currentClassroom)
        }
    })
    // Fetch the students in a classroom by the classroom id
    function fetchStudentsByClassroom(currentClassroom:number): void {
        fetch(`/getStudentsByClassroom?classroomId=${currentClassroom}`)
            .then(response => {
                if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(student_data => {
                // Update the state
                students = student_data;
            }).catch(error => {
                console.error('Error fetching students by classroom:', error);
            })
        }
    // Whether to display the message that the student was added susccessfuly 
    let StudentAddMessageActive: boolean = $state(false)

    // Add all the students delimetered by ; 
    function AddStudents() {
        const studentTextArea: HTMLTextAreaElement = document.getElementById("AddStudent") as HTMLTextAreaElement
        const studentString:string = studentTextArea.value
        const studentList: string[] = studentString.split(';').map(item => item.trim())
        //Get the classroom id from session
        const currentClassroom = sessionStorage.getItem("currentClassroom")
        // Post the data to the server 
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
            // Update the students that are displayed 
            fetchStudentsByClassroom(Number(currentClassroom))
            // Display the success message 
            setTimeout(() => {
                StudentAddMessageActive = false;
            }, 3000);})
        .catch(error => console.error('Error:', error));
    }

    // Function to remove a student from the current classroom 
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
    
    // The quizzes in the classroom to be displayed to the teacher
    let quizes: Quiz[] = $state();

    onMount(() => {
        // Fetch the quizzes in the classroom and update them
        const currentClassroom: number = Number(sessionStorage.getItem('currentClassroom'));
        if (!currentClassroom) {
            console.error('No currentClassroom found in sessionStorage.');
            return;
        } else {
            fetchQuizesByClassroom(currentClassroom)
        }
    })
    // Function to fetch the quizzes and update the state with them
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
    // Whether to the display the message that the adding of a quiz was successful
    let quizAddMessageActive: boolean = $state(false)
    function AddQuiz() { 
        const quizNameTextArea: HTMLTextAreaElement = document.getElementById("AddQuizName") as HTMLTextAreaElement
        const quizQuestionTextArea: HTMLTextAreaElement = document.getElementById("AddQuizQuestion") as HTMLTextAreaElement
        const selectedModeElement: HTMLInputElement = document.querySelector('input[name="quizType"]:checked') as HTMLInputElement
        const selectedMaxPointsElement: HTMLInputElement = document.getElementById('quizMaxPoints') as HTMLInputElement
        // Get the classroom id from session
        const currentClassroom: string = sessionStorage.getItem("currentClassroom")
        // Post the data to the endpoint 
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
    // Remove the seleteced quiz 
    async function removeQuiz(quiz: Quiz) {
        if (confirm(`Are you sure you want to remove ${quiz.name}?`)) {
            const currentClassroom: number = Number(sessionStorage.getItem('currentClassroom'));
            fetch('/removeQuiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({quizId: quiz.id})
            })
            .then(response => {
                return response.json()
            })
            .then(async (data) =>  {
                fetchQuizesByClassroom(currentClassroom)
            })
            .catch(error => console.error('Error:', error));
        }
    }
    // Close a quiz to the public 
    async function closeQuiz(quiz: Quiz) {
        if (confirm(`Are you sure you want to close ${quiz.name}?`)) {
            const currentClassroom: number = Number(sessionStorage.getItem('currentClassroom'));
            // Send the data to the endpoint 
            fetch('/closeQuiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({quizId: quiz.id})
            })
            .then(response => {
                return response.json()
            })
            .then(async (data) =>  {
                fetchQuizesByClassroom(currentClassroom)
            })
            .catch(error => console.error('Error:', error));
        }
    }

    // Format the date from the ISO string to a human readable format 
    function formatCloseAt(ISO: string): string {
        const date: Date = new Date(ISO);
        
        // Check if the ISO string is a valid date
        if (isNaN(date.getTime())) {
            return "Invalid date";
        }

        // "Month Day, Year, Hour:Minute AM/PM"
        return date.toLocaleString("en-GB", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });
    }

    // Redirect the teacher to the selected quiz 
    function teacherQuizRedirect(quiz: Quiz) {
        sessionStorage.setItem('currentQuiz', String(quiz.id));
        window.location.href = 'teacher_classroom_quiz'
    }
</script>
<Header 
classroomRedirect="/teacher_classroom_list"
>
</Header>

<div id="student_meta_wrapper">
    <div id="student_wrapper">
        <div id="student_tag">
            Students
        </div>
        {#each students as student,index}
        <div class="student_and_remove">
            <student id={"student" + index} class="student">
                {student.name} | {student.email}
            </student>
            <button class="student_remove" onclick={() => removeStudent(student)}>remove</button>
        </div>
        {/each}
    </div>
    <div id="student_add_wraper">
        <div id="student_add_tag">Add Students</div>
        <label for="AddStudent">Email addresses: (delimetered by ;)</label>
        <textarea name="AddStudent" id="AddStudent"></textarea>
        <button id="AddStudentButton" onclick={AddStudents}>Add</button>
        {#if (StudentAddMessageActive)}
            The users have been added
        {/if}
    </div>
</div>

<br>
<br>
<br>
<div id="quiz_meta_wrapper">
    <div id="quiz_wrapper">
        <div id="quiz_tag">Quizzes</div>
        {#each quizes as quiz,index}
            <div class="quiz_add_and_remove">
                <button class="quiz" id={"quiz" + index} onclick={() => teacherQuizRedirect(quiz)}>{quiz.name}</button>
                <div class="closes_wrapper">
                    {#if quiz.open}
                    Closes at: {formatCloseAt(quiz.closeAt)} |
                    <button class="close_quiz" onclick={() => closeQuiz(quiz)}>close </button>
                    {:else}
                    Closed
                    {/if}
                </div>
                <button class="quiz_remove" onclick={() => removeQuiz(quiz)}>remove</button>
            </div>
        {/each}
    </div>
    <div id="add_quiz_wrapper">
        <div id="add_quiz_tag">Add a quiz</div>
        <div id="add_quiz_line_wrapper">
            <label for="AddQuizName">Name:</label>
            <textarea name="AddQuizName" id="AddQuizName"></textarea>
            <label for="AddQuizQuestion">Question:</label>
            <textarea name="AddQuizQuestion" id="AddQuizQuestion"></textarea>
            <div id="radio_wrapper">
                <label>
                    <input type="radio" name="quizType" value="plaintext" checked>
                    Plaintext
                </label>
                <label>
                    <input type="radio" name="quizType" value="code">
                    Code
                </label>
            </div>
            <label for="quizMaxPoints">Max points:</label>
            <input id="quizMaxPoints" name="quizMaxPoints" type="number">
            <div id="datepicker">
                <input  bind:this={datepicker} type="text" placeholder="Select the closing time">
            </div>
            <button id="AddQuizButton" onclick={AddQuiz}>Add</button>
        </div>
    </div>
</div>


<Footer />

<style>
    #student_meta_wrapper {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
    }
    #student_wrapper {
        display: flex;
        flex-direction: column;
    }

    .student_remove:hover {
        color: red
    }

    .student {
        width: 20em;
    }
    .student_and_remove {
        display: flex;
        flex-direction: row;
        margin-bottom: 0.5em;
    }
    #student_wrapper  {
        margin-left: 2em;
    }

    #student_tag {
        font-size: 30px;
        margin-left: -1em;
    }
    #student_add_wraper {
        margin-right: 3em;
        display: flex;
        flex-direction: column;
    }

    #student_add_tag {
        font-size: 30px;
        margin-left: -1em;
    }

    #quiz_tag, #add_quiz_tag {
        font-size: 30px;
        margin-left: -1em;
    }

    #quiz_meta_wrapper {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
    }
    .quiz_add_and_remove {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        margin-bottom: 0.5em;
    }

    #quiz_wrapper {
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        margin-left: 2em;
        margin-bottom: 2em;
    }

    .closes_wrapper {
        width: 23em;
    }

    .close_quiz {
        margin: 0 1em 0 1em;
    }

    .quiz_remove {
        margin: 0 1em 0 1em;
    }

    .close_quiz:hover , .quiz_remove:hover {
        color: red;
    }   

    #add_quiz_wrapper {
        display: flex;
        flex-direction: column;
        margin-left: 2em;
        margin-bottom: 3em;
    }

    #quizMaxPoints {
        width: 3em;
    }

    #add_quiz_line_wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    #radio_wrapper {
        display: flex;
        direction: row;
        flex-wrap: wrap;
        width: 5em;
        margin-left: 0.5em;
    }

    #AddQuizName {
        height: 2.5em;
    }
    
    #add_quiz_line_wrapper,
    #AddQuizName,
    #AddQuizQuestion,
    #radio_wrapper,
    #quizMaxPoints,
    #datepicker {
        margin-left: 0.5em
    }   

    #AddQuizName, #datepicker {
        margin-right: 0.5em
    }

    .student_remove, .quiz_remove {
        text-align: center;
        width: 6em;
        border: 1px solid rgb(0,0,0,0.2);
        border-radius: 10px;
        box-sizing: content-box;
        box-shadow: 3px 2px 10px -2px rgba(0, 0, 0, 0.34);
    }
    .student_remove:hover, .quiz_remove:hover {
        color: red;
    }
    .student_remove:active, .quiz_remove:active {
        transform: scale(0.98);
        box-shadow: 2px 1px 5px 1px rgba(0, 0, 0, 0.14);
    }

    .quiz {
        width: 10em;
        margin-right: 8em;
        text-align: center;
        border: 1px solid rgb(0,0,0,0.2);
        border-radius: 10px;
        box-sizing: content-box;
        box-shadow: 3px 2px 10px -2px rgba(0, 0, 0, 0.34);
    }

    .quiz:active, #AddQuizButton:active, #AddStudentButton:active  {
        transform: scale(0.98);
        box-shadow: 2px 1px 5px 1px rgba(0, 0, 0, 0.14);
    }

    .quiz:hover, #AddQuizButton:hover, #AddStudentButton:hover{
        border: 1px solid rgba(0, 0, 255, 0.2);
        color: blue;
    }

    #AddQuizButton, #AddStudentButton {
        width: 4em;
        text-align: center;
        border: 1px solid rgb(0,0,0,0.2);
        border-radius: 10px;
        box-sizing: content-box;
        box-shadow: 3px 2px 10px -2px rgba(0, 0, 0, 0.34);
    }
    #AddStudentButton {
        margin-left:5.6em;
        margin-top: 0.5em;
    }
</style>



