import { useState } from 'react'
import { supabase } from './supabaseclient'
import blockstalllogo from "./assets/blockstalltrans.png";

export default function Auth() {

    async function signInWithTwitch() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'twitch',
        })
    }


    return (
        <div>

        <div className="hero w-screen">

            <div className="hero-content text-center ">
                <div className="w-full">
                    <img className="w-3/12 block ml-auto mr-auto mb-5" src={blockstalllogo} alt="The blockstall logo." />
                    <h1 className="text-5xl font-bold">Welcome to Blockstall!</h1>
                    <p className="py-6">The only website made to exclusively torture koriome. To access the site, you need to login with your Twitch account.</p>
                            <button onClick={signInWithTwitch} className="btn btn-primary mr-2">Sign in with Twitch</button>
                </div>
            </div>
        </div>

        </div>
    )
}