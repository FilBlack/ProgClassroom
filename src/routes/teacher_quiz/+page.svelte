<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount, onDestroy } from 'svelte'
    import { get } from 'svelte/store'
    import CodeMirror, { basicSetup } from '../../lib/CodeMirror.svelte'

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

    async function getQuizAndConnectionById(quizId: number) {
        const studentEmail = sessionStorage.getItem("currentStudentEmail")
        try {
            const response = await fetch(`/getQuizById?quizId=${quizId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const quiz = await response.json();
            const response2 = await fetch(`/getQuizStudentConnection?quizId=${quizId}&studentEmail=${studentEmail}`);
            console.log(response2)
            if (!response2.ok) {
                throw new Error(`HTTP error! status: ${response2.status}`);
            }
            const quizConnection = await response2.json();
            return [quiz, quizConnection];
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    function submitComment() {
        const currentQuizId = Number(sessionStorage.getItem('currentQuiz'));
        const currentStudentEmail = String(sessionStorage.getItem('currentStudentEmail'))
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

    function unsubmitComment() {
        const currentQuizId = Number(sessionStorage.getItem('currentQuiz'));
        const currentStudentEmail = String(sessionStorage.getItem('currentStudentEmail'))
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

    let isDisabled: boolean = $state()
    let store: { ready: () => boolean; subscribe(cb: any): () => any; set(newValue: any): void; } = $state() // Bound to codeMirror component
    let quiz: Quiz | null = $state()
    let quizConnection: StudentQuiz = $state()
    let commentSubmitted: boolean = $state(false)
    let commentText: string = $state()
    let teacherPoints: number = $state()
    onMount(async () => {
        try {
            const currentQuizId = Number(sessionStorage.getItem('currentQuiz'));;
            [quiz, quizConnection] = await getQuizAndConnectionById(currentQuizId)
            commentSubmitted = quizConnection.graded
            isDisabled = true
        } catch (error) {
            console.log(error)
        }
    })

</script>
<Header returnPage="/teacher_classroom_quiz"
classroomRedirect="/teacher_classroom_list"
>
</Header>


{#if quiz}
    Question:
    {quiz.question}

    {#if quizConnection.answered}
        Students Answer:
        {#if (quiz.type === "plaintext")}
            <textarea name="plaintext_answer" id="plaintext_answer" disabled>{quizConnection.answer ?  quizConnection.answer : " " }</textarea>
        {:else}
            <CodeMirror doc={quizConnection.answer ?  quizConnection.answer : " " }
            bind:docStore={store}
            extensions={basicSetup}
            disabled={isDisabled}></CodeMirror>
        {/if}
    {:else}
        {#if quiz.open}
            Not submitted yet
        {:else}
            Missing
        {/if}
    {/if}
    <label for="teacherComment">Your comment:</label>
    <textarea bind:value={commentText} name="teacherComment" id="teacherComment" disabled={commentSubmitted}></textarea>
    <label for="teacherPoints">Points (max {quiz.max_points}):</label>
    <input bind:value={teacherPoints} type="number" name="teacherPoints" id="teacherPoints" disabled={commentSubmitted}>


    {#if commentSubmitted}
        <button onclick={unsubmitComment}>Unsubmit</button>
    {:else}
        <button onclick={submitComment}>Submit</button>
    {/if}

{/if}
<Footer />