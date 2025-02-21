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
        type: 'plaintext' | 'code';
    }

    interface StudentQuiz {
        id: number;
        f_student_email: string;
        f_quiz_id: number;
        answer: string | null;
        answered: boolean;
        points: number | null;
    }

    async function getQuizAndConnectionById(quizId: number) {
        try {
            const response = await fetch(`/getQuizById?quizId=${quizId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const quiz = await response.json();
            const response2 = await fetch(`/getQuizStudentConnection?quizId=${quizId}`);
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


    // If the time has run out
    let timeRunOut: boolean = $state(false)
    function getTimeLeft(isoString: string) {
        const now = new Date();
        const targetDate = new Date(isoString);

        let diff = targetDate.getTime() - now.getTime();

        // Ensure the difference is not negative (if the target date has passed)
        if (diff < 0) {
            timeRunOut = true
            return { days:0, hours:0, minutes:0, seconds:0 }
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * 1000 * 60 * 60 * 24;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * 1000 * 60 * 60;

        const minutes = Math.floor(diff / (1000 * 60));
        diff -= minutes * 1000 * 60;

        const seconds = Math.floor(diff / 1000);

        return { days, hours, minutes, seconds };
        }
    // Runs every second to subtract time
    function subtractSecond() {
        if (timeLeft.seconds === 0) {
            if(timeLeft.minutes === 0) {
                if(timeLeft.hours === 0) {
                    if (timeLeft.days === 0) {
                        timeRunOut = true
                    } else {
                        timeLeft.days -= 1
                        timeLeft.hours = 23
                        timeLeft.minutes = 59
                        timeLeft.seconds = 59
                    }
                } else {
                    timeLeft.hours -= 1
                    timeLeft.minutes = 59
                    timeLeft.seconds = 59
                }
            } else {
                timeLeft.minutes -= 1
                timeLeft.seconds = 59
            }
        } else {
            timeLeft.seconds -= 1
        }
    }
    // Bind the possibilities to answer 
    let store: { ready: () => boolean; subscribe(cb: any): () => any; set(newValue: any): void; } = $state() // Bound to codeMirror component
    let plaintextAnswer: string = $state()

    function submitAnswer() {
        const currentQuizId = Number(sessionStorage.getItem('currentQuiz'));
        let answerText: string
        if (quiz.type === 'plaintext') {
            answerText = plaintextAnswer
        } else {
            answerText = get(store)
        }
        fetch('/submitQuizAnswer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quizId: currentQuizId, answerText})
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            } 
            return response.json();
        })
        .then((data) => {
            answerSubmitted = true
        })
        .catch(error => console.error('Error:', error));
    }

    function unsubmitAnswer() {
        const currentQuizId = Number(sessionStorage.getItem('currentQuiz'));
        fetch('/unsubmitQuizAnswer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quizId: currentQuizId})
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            } 
            return response.json();
        })
        .then(data => {
            answerSubmitted = false
        })
        .catch(error => console.error('Error:', error));
    }


    let quiz: Quiz | null = $state()
    let quizConnection: StudentQuiz = $state()
    let answerSubmitted: boolean = $state()
    let intervalId: number;
    let timeLeft: {days: number, hours: number, minutes: number, seconds:number} = $state({days: 0, hours: 0, minutes: 0, seconds:0})
    onMount(async () => {
        try {
            const currentQuizId = Number(sessionStorage.getItem('currentQuiz'));
            [quiz, quizConnection] = await getQuizAndConnectionById(currentQuizId)
            answerSubmitted = quizConnection.answered
            timeLeft = getTimeLeft(quiz.closeAt)
            // Executes every second
            intervalId = setInterval(() => {
                subtractSecond()
            }, 1000);
        } catch (error) {
            console.log(error)
        }
    })

    // Stop counting
    onDestroy(() => {
        clearInterval(intervalId);
    });
</script>
<Header returnPage="/student_classroom"
classroomRedirect="/student_classroom_list"
>
</Header>

{#if !timeRunOut}
    Time left:
    {timeLeft.days} days, {timeLeft.hours} hours, {timeLeft.minutes} minutes, {timeLeft.seconds} seconds
{:else}
    Quiz is closed
{/if}

{#if quiz}
    Question:
    {quiz.question}

    {#if !timeRunOut}
        Your Answer:
        {#if (quiz.type === "plaintext")}
            <textarea name="plaintext_answer" id="plaintext_answer" bind:value={plaintextAnswer} disabled={answerSubmitted}>{quizConnection.answer ?  quizConnection.answer : " " }</textarea>
        {:else}
            <CodeMirror doc={quizConnection.answer ?  quizConnection.answer : " " }
            bind:docStore={store}
            extensions={basicSetup}
            disabled={answerSubmitted}></CodeMirror>
        {/if}
        {#if answerSubmitted}
            <button onclick={unsubmitAnswer}>Unsubmit</button>
        {:else}
            <button onclick={submitAnswer}>Submit</button>
        {/if}
    {/if}
{/if}
<Footer />