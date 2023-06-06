import { useEffect, useState } from "react";
import { supabase } from './supabaseclient.js'
import Auth from './Auth'
import Redeems from './Redeems.jsx'
import blockstalllogo from './assets/blockstalltrans.png'

export let ws = new WebSocket('wss://bssocket.korio.me');



function App() {
    const [session, setSession] = useState(null)
    const [username, setUsername] = useState(null)
    const [avatar, setAvatar] = useState(null)
    const [tokens, setTokens] = useState(null)



    useEffect(() => {


        getUser()
    }, [session])

    async function getUser() {

        if(session){
            let {user} = session

            let {data, error} = await supabase
                .from('users')
                .select('username, avatar_url, tokens')
                .eq('id', user.id)
                .single()

            if (error) {
                console.warn(error)
            } else if (data){
                setUsername(data.username)
                setAvatar(data.avatar_url)
                setTokens(data.tokens)
                //funnyTokens = data.tokens;
            }
        }

    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })
    }, [])


    async function signout() {
        const { error } = await supabase.auth.signOut()
    }
    async function signInWithTwitch() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'twitch',
        })
    }

    const parentGetUser = () => {
        getUser();
    }

    ws.addEventListener("message", (event) => {
        let json = JSON.parse(event.data);
        if(json.messagetype === "ping"){
            ws.send('{ "messagetype": "pong" }')
        }
    });



    return (
        <div className="parent">
            <div className="navbar bg-base-100">
                <div className="flex-1">
                    <a className="btn btn-ghost normal-case text-xl">
                        <div className="w-10 mr-2">
                            <img src={blockstalllogo} />
                        </div>
                        Blockstall
                    </a>
                </div>
                <div className="flex-none gap-2">
                    {!session? null : <div className="badge badge-lg align-middle">{tokens} tokens</div>}
                    {!session?
                        <a className="btn" onClick={signInWithTwitch}>Sign in with Twitch</a>
                        :

                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                                <div className="w-10 rounded-full">
                                    <img src={avatar} />
                                </div>
                            </label>
                            <ul tabIndex={0} className="mt-3 p-2 shadow-lg menu menu-compact dropdown-content bg-base-100 rounded-box w-52">
                                <li><p className="bg-base-100">Hey, {username}!</p></li>
                                <li><a className="hover:bg-blend-darken bg-gradient-to-r from-amber-400 to-amber-500 text-base-100" href="https://charity.korio.me" target="_blank" rel="noopener noreferrer">Want more tokens?</a></li>
                                <li><a onClick={signout}>Logout</a></li>
                            </ul>
                        </div>
                    }

                </div>
            </div>
            <div className='spacer'></div>
            <div className="container">
                {!session ? <Auth /> : <Redeems key={session.user.id} session={session} parentGetUser={parentGetUser}/>}
            </div>
        </div>

    )
}

export default App;