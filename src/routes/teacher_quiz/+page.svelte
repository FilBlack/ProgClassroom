<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount, onDestroy } from 'svelte'
    import { get } from 'svelte/store'
    import CodeMirror from 'svelte-codemirror-editor'
    import { javascript } from '@codemirror/lang-javascript'    
    import type { LanguageSupport } from '@codemirror/language'

    // Define the language for the codemirro editor
    let extensions: LanguageSupport[] = [
        javascript(),
    ];

    // Define all the necessary interfaces for typescript 
    interface Quiz {
        id:number;
        f_classroom_id: number;
        name: string;
        question: string;
        open: boolean;
        closeAt: string;
        max_points: number;
        type: 'plaintext' | 'code';
    }

    interface StudentQuiz {
        id: number;
        f_student_email: string;
        f_quiz_id: number;
        answer: string | null;
        answered: boolean;
        points: number | null;
        graded: boolean;
    }
    
    // Get the quiz information and the student quiz connection data
    async function getQuizAndConnectionById(quizId: number) : Promise<[Quiz, StudentQuiz]> {
        const studentEmail: string = String(sessionStorage.getItem("currentStudentEmail"))
        try {
            const response: Response = await fetch(`/getQuizById?quizId=${quizId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const quiz: Quiz = await response.json();
            const response2: Response = await fetch(`/getQuizStudentConnection?quizId=${quizId}&studentEmail=${studentEmail}`);
            if (!response2.ok) {
                throw new Error(`HTTP error! status: ${response2.status}`);
            }
            const quizConnection: StudentQuiz = await response2.json();
            return [quiz, quizConnection];
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // Submit the teacher's comment 
    function submitComment() {
        const currentQuizId: number = Number(sessionStorage.getItem('currentQuiz'));
        const currentStudentEmail: string = String(sessionStorage.getItem('currentStudentEmail'))
        // Post the comment data to the server
        fetch('/submitQuizComment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quizId: currentQuizId, commentText: commentText, studentEmail: currentStudentEmail, points: teacherPoints})
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            } 
            return response.json();
        })
        .then((data) => {
            commentSubmitted = true
        })
        .catch(error => console.error('Error:', error));
    }

    // Unsubmit the teacher's 
    function unsubmitComment() {
        const currentQuizId: number = Number(sessionStorage.getItem('currentQuiz'));
        const currentStudentEmail: string = String(sessionStorage.getItem('currentStudentEmail'))
        fetch('/unsubmitQuizComment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quizId: currentQuizId, studentEmail: currentStudentEmail})
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            } 
            return response.json();
        })
        .then(data => {
            commentSubmitted = false
        })
        .catch(error => console.error('Error:', error));
    }

    let code: string = $state("") // Stores the code for the code editor
    let quiz: Quiz | null = $state()
    let quizConnection: StudentQuiz | null = $state()
    let commentSubmitted: boolean = $state(false) // If the coomment is submitted
    let commentText: string = $state() // The comment text from the teacher
    let teacherPoints: number = $state() // The points the teacher has given
    onMount(async () => {
        try {
            // Get the quiz data and update the stores based on the current quiz 
            const currentQuizId : number = Number(sessionStorage.getItem('currentQuiz'));;
            [quiz, quizConnection] = await getQuizAndConnectionById(currentQuizId)
            // Check if the quiz has been submitted before that 
            commentSubmitted = quizConnection.graded
            if (quizConnection.answered) {
                code = quizConnection.answer
            } 
        } catch (error) {
            console.log(error)
        }
    })

</script>
<Header
classroomRedirect="/teacher_classroom_list"
>
</Header>


{#if quiz}
    <div id="meta_wrapper">
        <div id="question_tag">
            Question: {quiz.question}
        </div>
        <div id="answer_wrapper">
            {#if quizConnection.answered}
                Student's Answer:
                {#if (quiz.type === "plaintext")}
                    <br>
                    <textarea name="plaintext_answer" id="plaintext_answer" disabled>{quizConnection.answer ?  quizConnection.answer : " " }</textarea>
                {:else}
                {#if code !== ''}
                    <CodeMirror bind:value={code} {extensions} editable={false}></CodeMirror>
                {/if}
                {/if}
            {:else}
                {#if quiz.open}
                    Not submitted yet
                {:else}
                    Missing
                {/if}
            {/if}
        </div>
        <div id="comment_wrapper">
            <div id="comment">
                <label for="teacherComment">Your comment: </label>
                <textarea bind:value={commentText} name="teacherComment" id="teacherComment" disabled={commentSubmitted}></textarea>
            </div>
            <div id="points">
                <label for="teacherPoints">Points (max {quiz.max_points}): </label>
                <input bind:value={teacherPoints} type="number" name="teacherPoints" id="teacherPoints" disabled={commentSubmitted}>
            </div>
            <div>
                {#if commentSubmitted}
                    <button class="submission" onclick={unsubmitComment}>Unsubmit</button>
                {:else}
                    <button  class="submission"onclick={submitComment}>Submit</button>
                {/if}
            </div>
        </div>
    </div>

{/if}
<Footer />

<style>
    #answer_wrapper {
        margin-bottom: 2em;

    }
    #meta_wrapper {
        margin-left: 1em;
        display: flex;
        flex-direction: column;
    }
    #question_tag {
        margin-bottom: 0.5em;
    }
    #comment_wrapper {
        display: flex;
        flex-direction: column;
    }
    #comment, #points {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 0.4em;
    }
    textarea {
        width: 20em;
    }
    input[type="number"] {
        width: 4em;
    }
    label {
        margin-right: 0.5em
    }

    .submission:active  {
        transform: scale(0.98);
        box-shadow: 2px 1px 5px 1px rgba(0, 0, 0, 0.14);
    }

    .submission:hover{
        border: 1px solid rgba(0, 0, 255, 0.2);
        color: blue;
    }

    .submission {
        width: 5em;
        text-align: center;
        border: 1px solid rgb(0,0,0,0.2);
        border-radius: 10px;
        box-sizing: content-box;
        box-shadow: 3px 2px 10px -2px rgba(0, 0, 0, 0.34);
    }
    .submission {
        margin-top: 0.5em;
    }
</style>