<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount } from 'svelte'

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
    }


    let combinedQuizzes: [Quiz, StudentQuiz][] = $state([])
    async function getQuizzes() {
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
    let totalPoints: number = $state(0)
    let totalMaxPoints: number = $state(0)
    onMount(async () => {
        combinedQuizzes = await getQuizzes();
        for (const [quiz, quizConnection] of combinedQuizzes) {
            totalMaxPoints += quiz.max_points
            totalPoints += quizConnection.points
        }
    });
    
    function quizRedirect(quiz_id: number) {
        sessionStorage.setItem('currentQuiz', String(quiz_id));
        window.location.href = 'student_quiz'
    }

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
        <div class="quiz_name">Name:</div>
        <div class="submission">
            Submission:
        </div>
        <div class="closure">
            Closes at:
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
    }
    .quiz_name {
        width: 14em;
        text-align: left;
    }
    .quiz_name:hover {
        color:blue;
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

</style>