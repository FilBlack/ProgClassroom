<svelte:options runes={true}/>
<script lang="ts">
    import Header from "../lib/Header.svelte"
    import Footer from "../lib/Footer.svelte"

    function teacher_login() {
        console.log("new here")
        window.location.href = 'http://localhost:3000/auth/google/?position=student';
        
    }
</script>
<Header />

Are you a student or a teacher? 



HII THIS IS THE NEWEST VERSIOSNODSFSDIFSODNFdsf
sfdsfdsf
<button id="teacher_auth">Teacher</button>

<button id="student_auth" onclick={teacher_login}>Student</button>
<Footer />


