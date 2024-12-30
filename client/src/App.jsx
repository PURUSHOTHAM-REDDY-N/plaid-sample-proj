import {useEffect, useState} from 'react'
import reactLogo from './assets/react.svg'
import axios from "axios";
import {usePlaidLink} from "react-plaid-link";
// import './App.css'

axios.defaults.baseURL ="http://localhost:8000"

function PlaidAuth({publicToken}) {
  const [account, setAccount] = useState();
  const [saveAccessToken, setSaveAccessToken] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    async function fetchData() {
      let accessToken = await axios.post("/exchange_public_token", {public_token: publicToken});
      console.log("accessToken", accessToken.data);
      setSaveAccessToken(accessToken.data.accessToken);
      const auth = await axios.post("/auth", {access_token: accessToken.data.accessToken});
      
      console.log("auth data ", auth.data);
      setAccount(auth.data.numbers.ach[0]);
    }
    fetchData();
  }, []);

  const seeTransactions = async () => {
    const transactions = await axios.post("/transactions", {access_token: saveAccessToken});
      console.log("transactions", transactions.data);
      setTransactions(transactions.data);
  }
  return saveAccessToken && (
      <>
      <button onClick={()=>seeTransactions()}>get All transactions</button>
        {/* <p>Account number: {account.account}</p>
        <p>Routing number: {account.routing}</p> */}
        <div>
        {transactions.map((transaction, index) => {
          return (
              <div key={index} style={{border: "1px solid black", padding: "10px", margin: "10px"}}>
                <p>Amount: {transaction.amount} {transaction.iso_currency_code}</p>
                <p>Date: {transaction.date}</p>
                <p>Name: {transaction.name}</p>
                <p>txt Id: {transaction.transaction_id}</p>
              </div>
          );
        })}
        </div>
        
      </>
  );
}

function App() {
  const [linkToken, setLinkToken] = useState();
  const [publicToken, setPublicToken] = useState();

  useEffect(() => {
    async function fetch() {
      const response = await axios.post("/create_link_token");
      setLinkToken(response.data.link_token);
    }
    fetch();
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      setPublicToken(public_token);
      console.log("success", public_token, metadata);
      // send public_token to server
    },
  });

  return publicToken ? (<PlaidAuth publicToken={publicToken} />) : (
      <button onClick={() => open()} disabled={!ready}>
        Connect a bank account
      </button>
  );
}

export default App
