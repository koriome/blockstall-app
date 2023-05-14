import { useEffect, useState } from "react";
import { supabase } from './supabaseclient.js'
import './App.css'



function App() {
    const [advancements, setAdvancements] = useState([]);


    useEffect(() => {
        getAdvancements();
    }, []);

    async function buttonPress(mcid, tokens){
        console.log(`${mcid} and ${tokens}`);
        let request = new XMLHttpRequest();
        request.open("POST", "https://n8n.korio.me/webhook-test/thingy");
        request.setRequestHeader("Content-type", "application/json");
        request.setRequestHeader("Access-Control-Allow-Origin", "*");
        var params = {
            id: {mcid}
        }
        request.send(JSON.stringify(params));
        console.log("REMOVE TOKENS FROM USER ACCOUNT")
    }

    async function getAdvancements() {
        const { data } = await supabase.from("Advancements").select();
        setAdvancements(data);
    }

    return (
        <ul>
            {advancements.map((advancement) => (
                <li key={advancement.name}>
                    <p>{advancement.name}</p>
                    <button onClick={() => buttonPress(advancement.mcid, advancement.tokens)}>hi</button>
                </li>
            ))}
        </ul>
    );
}

export default App;