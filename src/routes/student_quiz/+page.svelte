<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount, onDestroy } from 'svelte'
    import { get } from 'svelte/store'
    import CodeMirror from 'svelte-codemirror-editor'
    import { javascript } from '@codemirror/lang-javascript'

    // Define the mode of the code editor
    let extensions = [
        javascript(),
    ];

    // Define all the neccessary interaces for typescript 
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
        graded: boolean;
        comment: string;
    }

    // Get a quiz and its corresponding connection to the student by its id
    async function getQuizAndConnectionById(quizId: number): Promise<[Quiz, StudentQuiz]> {
        try {
            // First get the quiz by its id
            const response: Response = await fetch(`/getQuizById?quizId=${quizId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const quiz : Quiz = await response.json();
            // After we get the connection by the quiz id and the id of the student, which is saved on the session in the server
            const response2: Response = await fetch(`/getQuizStudentConnection?quizId=${quizId}`);
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


    // If the time has run out
    let timeRunOut: boolean = $state(false)
    // Get the time left based on the ISO string
    function getTimeLeft(isoString: string): { days:number, hours:number, minutes:number, seconds:number } {
        const now : Date = new Date();
        const targetDate : Date = new Date(isoString);

        let diff: number = targetDate.getTime() - now.getTime();

        // Ensure the difference is not negative (if the target date has passed)
        if (diff < 0) {
            timeRunOut = true
            return { days:0, hours:0, minutes:0, seconds:0 }
        }
        const days : number = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * 1000 * 60 * 60 * 24;

        const hours : number = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * 1000 * 60 * 60;

        const minutes : number = Math.floor(diff / (1000 * 60));
        diff -= minutes * 1000 * 60;

        const seconds : number = Math.floor(diff / 1000);

        return { days, hours, minutes, seconds };
        }

    // Runs every second to subtract time like a clock
    function subtractSecond(): void{
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

    // The quiz is either code or plaintext, we bind both the possibilities to their states
    let plaintextAnswer: string = $state()
    let code: string = $state(`console.log("Hello, CodeMirror!");`);

    // Submit the student's answer
    function submitAnswer(): void {
        const currentQuizId = Number(sessionStorage.getItem('currentQuiz'));
        // Asign the answer text based on code or plaintext
        let answerText: string
        if (quiz.type === 'plaintext') {
            answerText = plaintextAnswer
        } else {
            answerText = code
        }
        // Post the data to the endpoint
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

    // Unsubmit the student's answer
    function unsubmitAnswer(): void {
        const currentQuizId: number = Number(sessionStorage.getItem('currentQuiz'));
        // Post the data to the endpoint 
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
    let intervalId: number; // The interval id so that we can close it later
    let timeLeft: {days: number, hours: number, minutes: number, seconds:number} = $state({days: 0, hours: 0, minutes: 0, seconds:0}) // Timer
    let timeChecked: boolean = $state(false) // Has the time been checked, so that we can load the content on the site? 
    let submissionChecked: boolean = $state(false) // Have we checked if the student has submitted?
    onMount(async () => {
        try {
            // Get the id of th current quiz
            const currentQuizId: number = Number(sessionStorage.getItem('currentQuiz')); 
            // Get the quiz and the connection by the quiz id 
            [quiz, quizConnection] = await getQuizAndConnectionById(currentQuizId)
            // Check if the student has answered
            answerSubmitted = quizConnection.answered
            submissionChecked = true
            // If the quiz is open, start the timer, else set timeRunOut to true
            if (quiz.open) {
                timeLeft = getTimeLeft(quiz.closeAt)
                if (timeLeft.days+ timeLeft.hours + timeLeft.minutes + timeLeft.seconds === 0){
                    timeRunOut = true
                }
            } else {
                timeRunOut = true
            }
            timeChecked = true
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
<Header
classroomRedirect="/student_classroom_list"
>
</Header>
<div id="meta_wrapper">

    <div id="time_left">
        {#if !timeRunOut && timeChecked}
            <div id="time_left_left"class="bold">Time left:</div>
            <div>{timeLeft.days} days, {timeLeft.hours} hours, {timeLeft.minutes} minutes, {timeLeft.seconds} seconds</div>
        {:else}
            Quiz is closed
        {/if}
    </div>
    
    {#if quiz}
        <div id="question_wrapper">
            <div id="question">
                <div id="question_left" class="bold">Question: </div> {quiz.question}
            </div>
        
            {#if !timeRunOut}
                <div id="answer">
                    {#if (quiz.type === "plaintext")}
                        <textarea name="plaintext_answer" id="plaintext_answer" bind:value={plaintextAnswer} disabled={answerSubmitted}>{quizConnection.answer ?  quizConnection.answer : " " }</textarea>
                    {:else if submissionChecked}
                        <CodeMirror bind:value={code} {extensions} editable={!answerSubmitted} />
                    {/if}
                </div>
                <div id="submission">
                    {#if answerSubmitted}
                        <button onclick={unsubmitAnswer}>Unsubmit</button>
                    {:else}
                        <button onclick={submitAnswer}>Submit</button>
                    {/if}
                </div>
            {/if}
        </div>
        {#if quizConnection.comment}
        Teacher comment:
        {quizConnection.comment}
    {/if}
    {/if}

    

</div>
<Footer />

<style>
    #question_left {
        margin-right: 0.5em;
    }
    #meta_wrapper {
        display: flex;
        flex-direction: column;
        margin-left: 1em;
    }
    .bold {
        font-weight: 600;
    }
    #question {
        display: flex;
        flex-direction: row;
        margin-bottom: 0.5em;
    }
    #time_left {
        display: flex;
        flex-direction: row;
    }
    #time_left_left {
        margin-right: 0.5em;
    }
    textarea {
        width: 100vw;
    }
    #submission {
        width: 100vw;
        text-align: center;
    }
    #answer {
        margin-left: -1em;
    }
</style>
