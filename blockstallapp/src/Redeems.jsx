import {useEffect, useState} from "react";
import {supabase} from "./supabaseclient.js";
import { ws } from "./App.jsx";
import App from "./App.jsx";


export default function Redeems({ session, parentGetUser }) {
    const [advancements, setAdvancements] = useState([]);
    const [username, setUsername] = useState(null)
    const [avatar, setAvatar] = useState(null)
    const [tokens, setTokens] = useState(null)




    useEffect(() => {
        getUser()

        const users = supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: '*' },
                (payload) => {
                    getAdvancements();
                    getUser();
                    console.log("page update")
                }
            )
            .subscribe()
    }, [session])

    async function getUser() {
        const {user} = session

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
        }

    }

    useEffect(() => {
        getAdvancements();
    }, []);


    function dbSubscribe(){

        const users = supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: '*' },
                (payload) => {
                    getAdvancements();
                    getUser();
                    console.log("page update")
                }
            )
            .subscribe()

    }




    async function getAdvancements() {
        const {data} = await supabase.from("advancements").select().order('sorter', { ascending: true });
        setAdvancements(data);
    }

    async function signout() {
        const { error } = await supabase.auth.signOut()
    }


    async function buttonPress(mcid, price, completed, queue) {
        if(tokens >= price){
            const { user } = session;
            console.log("Sending websocket message")
            dbSubscribe();
            ws.send(JSON.stringify({
                messagetype: "redeem",
                mcid: mcid,
                price: price,
                completed: completed,
                queue: queue,
                userid: user.id,
                username: username,
                usertokens: tokens
            }));
            //alert(`you now have ${tokens} tokens! thank you for your contribution!`)
        } else{
            alert("Hey! You don't have enough tokens for this. Stop by charity.korio.me to donate for more! (^-^)")
        }
        console.log(`${mcid} and ${tokens}`);
        handleToggle()
        setTimeout(() => { parentGetUser(); }, 500);
    }


    return (
        <div>



            <div className="hero w-screen">
                <div className="hero-content text-center">
                    <div className="w-full">
                        <div className="alert alert-error shadow-lg">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Blockstall is not live yet!! any redemptions made WILL NOT COUNT!</span>
                            </div>
                        </div>
                        <h1 className="text-5xl font-bold">Advancements</h1>
                        <p className="py-6">Welcome to where the magic happens! This is a list of every advancement in minecraft. Go to the one that you would like to see taken away from me, and use your hard-earned tokens to redeem it. To get you started, here are links to get information about advancements and acquire tokens. I'd also recommend using Crtl+F to search.</p>
                        <span>
                            <a href="https://minecraft.fandom.com/wiki/Advancement" target="_blank" rel="noopener noreferrer" className="btn btn-primary mr-2">Advancement Wiki</a>
                            <a href="https://charity.korio.me" target="_blank" rel="noopener noreferrer" className="btn btn-accent">Get Tokens</a>
                        </span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto w-screen flex justify-center">
                <table className="table table-zebra w-4/5">
                    {/* head */}
                    <thead>
                    <tr>
                        <th>Advancement</th>
                        <th>Price</th>
                        <th>Completed</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {/* row 1 */}
                    {advancements.map((advancement) => (

                    <tr>
                        <td>
                            <div className="flex items-center space-x-3">
                                <div>
                                    <p>{advancement.name}</p>
                                </div>
                            </div>
                        </td>
                        <td>
                            {advancement.tokens}
                        </td>
                        <td>
                            {!advancement.completed?
                                <div>
                                    {!advancement.queue < 1?
                                        <div className="badge badge-error badge-lg">In Queue: {advancement.queue}</div>
                                        :
                                        <div className="badge badge-error badge-lg">Not Completed</div>
                                    }
                                </div>
                                :
                                <div className="badge badge-success badge-lg">Completed</div>
                            }
                        </td>
                        <th>
                            <button onClick={() => buttonPress(advancement.mcid, advancement.tokens, advancement.completed, advancement.queue)} className="btn btn-ghost">redeem</button>
                        </th>
                    </tr>
                    ))}
                    </tbody>
                </table>
            </div>


        </div>
    );
}