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
<Header returnPage="/"
classroomRedirect="/teacher_classroom_list"
>
</Header>


Are you a student or a teacher? 

<button id="teacher_auth" onclick={teacher_login}>Teacher</button>

<button id="student_auth" onclick={student_login}>Student</button>
<Footer />


