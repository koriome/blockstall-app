import {useEffect, useState} from "react";
import {supabase} from "./supabaseclient.js";


export default function Redeems({ session }) {
    const [advancements, setAdvancements] = useState([]);
    const [username, setUsername] = useState(null)
    const [avatar, setAvatar] = useState(null)
    const [tokens, setTokens] = useState(null)



    let ws = new WebSocket('ws://192.168.1.239:9666');

    useEffect(() => {
        getUser()
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

    ws.addEventListener("message", async (event) => {
        let json = JSON.parse(event.data)
        console.log(json.messagetype);
        if(json.messagetype === "completion"){
            let {data, error} = await supabase
                .from('advancements')
                .select('*')
                .eq('mcid', json.mcid)
                .single()
            if(data.queue === 0){
                let {error} = await supabase
                    .from('advancements')
                    .update({completed: true})
                    .eq('mcid', json.mcid);
                if (error){
                    alert(error.message)
                }
            } else{
                let {error} = await supabase
                    .from('advancements')
                    .update({queue: data.queue-1})
                    .eq('mcid', json.mcid);
                if (error){
                    alert(error.message)
                }
            }
        }
    });


    const users = supabase.channel('custom-all-channel')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'advancements' },
            (payload) => {
                getAdvancements();
            }
        )
        .subscribe()





    async function getAdvancements() {
        const {data} = await supabase.from("advancements").select();
        setAdvancements(data);
    }

    async function signout() {
        const { error } = await supabase.auth.signOut()
    }

    async function steal(price){

        const{user}=session;

        let {error} = await supabase
            .from('users')
            .update({tokens: tokens-price})
            .eq('id', user.id);
        if (error){
            alert(error.message)
        }

        setTokens(tokens-price);
    }

    async function buttonPress(mcid, price) {
        if(tokens >= price){
            console.log("Sending websocket message")
            await steal(price);
            let {data, error} = await supabase
                .from('advancements')
                .select('*')
                .eq('mcid', mcid)
                .single()
            console.log(data.completed);
            let q = data.queue;
            if(data.completed === false){
                console.log("WE GOT HERE");
                let {error} = await supabase
                    .from('advancements')
                    .update({queue: data.queue+1})
                    .eq('mcid', mcid);
                if (error){
                    alert(error.message)
                }
            } else{
                let {error} = await supabase
                    .from('advancements')
                    .update({completed: false})
                    .eq('mcid', mcid);
                if (error){
                    alert(error.message)
                }
            }
            ws.send(JSON.stringify({
                messagetype: "redeem",
                advancement: {mcid},
                username: {username}
            }));

            //alert(`you now have ${tokens} tokens! thank you for your contribution!`)
        } else{
            alert("Hey! You don't have enough tokens for this. Stop by charity.korio.me to donate for more! (^-^)")
        }
        console.log(`${mcid} and ${tokens}`);
    }


    return (
        <div>

            <div className="hero w-screen">
                <div className="hero-content text-center">
                    <div className="w-full">
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
                            <button onClick={() => buttonPress(advancement.mcid, advancement.tokens)} className="btn btn-ghost">redeem</button>
                        </th>
                    </tr>
                    ))}
                    </tbody>
                </table>
            </div>


        </div>
    );
}