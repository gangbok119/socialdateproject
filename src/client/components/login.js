import React from 'react';
import useForm from 'react-hook-form'
import axios from 'axios';


const Login = () => {
    const { register, handleSubmit, watch, errors } = useForm()

    return (
        <>
        <h2>passport-local example</h2>
        <form method='POST' action='http://localhost:8080/login'>
            <input type='text' name='username' placeholder='enter username'/>
            <input type='password' name='password' placeholder='enter password'/>
            <input type='submit' value='submit'/>
        </form>
        </>
    )
}

export default Login;