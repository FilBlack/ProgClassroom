<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount } from 'svelte'

    // Define the necessary interfaces for typescript
    interface Quiz {
        id:number;
        f_classroom_id: number;
        name: string;
        question: string;
        open: boolean;
        max_points: number;
        closeAt: string;
        type: 'plaintext' | 'code';
    }

    interface StudentQuiz {
        id: number;
        f_student_email: string;
        f_quiz_id: number;
        max_points:number;
        answer: string | null;
        answered: boolean;
        points: number | null;
        graded: boolean;
        comment: string;
    }

    // Combined quiz and corresponding student quiz connection information
    let combinedQuizzes: [Quiz, StudentQuiz][] = $state([])
    async function getQuizzes() : Promise<[Quiz, StudentQuiz][]> {
        try {
            const currentClassroom :string = sessionStorage.getItem('currentClassroom')
            const response = await fetch(`/getQuizzesByStudentAndClassroom?currentClassroom=${currentClassroom}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            const quizData: Quiz[] = await response.json();
            const quizIds: number[]  = quizData.map(quiz => quiz.id)
            // Get the needed student connection for each quiz 
            const response2 = await fetch(`getQuizStudentConnectionsByQuizIds?quizIds=${quizIds.join(',')}`)
            const connectionData: StudentQuiz[] = await response2.json()
            // Combine the quiz and connection into one for easier use 
            const combinedData: [Quiz, StudentQuiz][] = quizData.map((quiz, index) => {
                return [quiz, connectionData[index]]
            })
            return combinedData
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            throw new Error('Failed to fetch quizzes' );
        }
    }
    // Total points the student got in the classroom
    let totalPoints: number = $state(0)
    // Maximum points he could have gotten in the classroom 
    let totalMaxPoints: number = $state(0)
    // Triggers when the components are mounted
    onMount(async () => {
        combinedQuizzes = await getQuizzes();
        // Add up all the points
        for (const [quiz, quizConnection] of combinedQuizzes) {
            totalMaxPoints += quiz.max_points
            totalPoints += quizConnection.points
        }
    });
    
    // Redirect the student to the quiz he has selected
    function quizRedirect(quiz_id: number) : void{
        // We save the current quiz id in the session for later use
        sessionStorage.setItem('currentQuiz', String(quiz_id));
        window.location.href = 'student_quiz'
    }

    // Format the close at date from the ISO string to human readable
    function formatCloseAt(ISO: string): string {
        const date = new Date(ISO);
        
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

    
</script>
<Header
classroomRedirect="/student_classroom_list"
>
</Header>
<div id="quizzes_tag">Quizzes</div>
<div id="quiz_wrapper">

    <div class="quiz quiz_label">
        <div class="quiz_name_special">Name:</div>
        <div class="submission">
            Submission:
        </div>
        <div class="closure">
            Closes at:
        </div>
        <div class=graded>
            Graded:
        </div>
    </div>
    {#each combinedQuizzes as [quiz, quizConnection], i}
        <div class="quiz">
            <button class="quiz_name" onclick={() => quizRedirect(quiz.id)}>{quiz.name}</button>
            <div class="submission">
                {#if quizConnection.answered}
                    Submitted
                    {#if quizConnection.points}
                    {quizConnection.points}/{quiz.max_points}
                    {/if}
                {:else}
                    Not submitted
                {/if}
            </div>
            <div class="closure">
                {#if quiz.open}
                    {formatCloseAt(quiz.closeAt)}
                {:else}
                    Closed
                {/if}
            </div>
            <div class="graded">
                {#if quizConnection.graded}
                    Graded
                {:else}
                    Not graded
                {/if}
            </div>
        </div>
        
    {/each}
</div>
<div id="total_score">
    Total score: {totalPoints}/{totalMaxPoints}
</div>


<Footer />

<style>
    #quizzes_tag {
        margin-left:1em;
        font-size: 30px;
        margin-bottom: 1em;
    }
    #quiz_wrapper {
        display: flex;
        flex-direction: column;
    }
    .quiz {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        margin-left: 2em;
        margin-bottom: 1em;
    }
    .quiz_name_special {
        width: 14em;
        text-align: left;
    }
    .quiz_name {
        width: 10em;
        margin-right: 4em;
        text-align: center;
        border: 1px solid rgb(0,0,0,0.2);
        border-radius: 10px;
        box-sizing: content-box;
        box-shadow: 3px 2px 10px -2px rgba(0, 0, 0, 0.34);
    }

    .quiz_name:active {
        transform: scale(0.98);
        box-shadow: 2px 1px 5px 1px rgba(0, 0, 0, 0.14);
    }

    .quiz_name:hover {
        border: 1px solid rgba(0, 0, 255, 0.2);
        color: blue;
    }
    
    .submission {
        width: 12em;
    }

    #total_score {
        margin: 1em 0 0 1em;
        font-size: 30px;
    }

    .quiz_label {
        margin-left: 1.5em;
        font-size: 28px;    
        font-weight: 600;
    }

    .closure {
        width: 12em;
    }

</style>