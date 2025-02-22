<svelte:options runes={true}/>
<script lang="ts">
    import Header from "../lib/Header.svelte"
    import Footer from "../lib/Footer.svelte"
    function teacher_login() {
        window.location.href = 'auth/google/?position=teacher';
        
    }
    function student_login() {
        window.location.href = 'auth/google/?position=student';
        
    }
</script>
<Header 
classroomRedirect="/teacher_classroom_list"
>
</Header>

<div class="centered question-wrapper" >
    <div id=teacher_question>
        Are you a student or a teacher? 
    </div>
</div>

<div class="centered">
    <button id="teacher_auth" onclick={teacher_login}>Teacher</button>
    <button id="student_auth" onclick={student_login}>Student</button>
</div>


<Footer />


<style>
.centered {
    display:flex;
    justify-content: center;
    align-items: center;
}

#teacher_auth, #student_auth {
    margin: 0 2em 0 2em;
    font-size: 1.7em

}

#teacher_auth {
    border: solid 4px rgb(0, 0, 255);
    background-color: rgba(5, 138, 255, 0.934);
}

#student_auth {
    border: solid 4px rgb(6, 195, 0);
    background-color: rgba(172, 255, 124, 0.934);
}

#teacher_auth, #student_auth {
    border-radius: 10px;
    padding: 20px 20px 20px 20px; 
    box-sizing: content-box;
    box-shadow: 5px 4px 16px -2px rgba(0, 0, 0, 0.44);
    line-height: 0.9em;
}

#teacher_auth:active, #student_auth:active {
    transform: scale(0.98);
    box-shadow: 2px 1px 5px 1px rgba(0, 0, 0, 0.14);
}




#teacher_question {
    font-size: 1.5em
}

.question-wrapper {
    margin: 1em 0 2em 0;
}
</style>

