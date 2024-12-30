const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": "",
      "PLAID-SECRET": "",
    },
  },
});

const plaidClient = new PlaidApi(configuration);
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/hello", (request, response) => {
  response.json({ message: "hello " + request.body.name });
});
app.get("/hello", (request, response) => {
  response.json({ message: "hello " + request.body.name });
});

app.post("/create_link_token", async function (request, response) {
  const plaidRequest = {
    user: {
      client_user_id: "user",
    },
    client_name: "Plaid Test App",
    products: ["auth","transactions"],
    language: "en",
    redirect_uri: "http://localhost:5173/",
    country_codes: ["US"],
  };
  try {
    const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
    response.json(createTokenResponse.data);
  } catch (error) {
    console.log(error);
    response.status(500).send("failure");
    // handle error
  }
});

app.post("/auth", async function (request, response) {
  try {
    const access_token = request.body.access_token;
    const plaidRequest = {
      access_token: access_token,
    };
    const plaidResponse = await plaidClient.authGet(plaidRequest);
    response.json(plaidResponse.data);
  } catch (e) {
    response.status(500).send("failed");
  }
});

app.post("/transactions", async function (request, response) {
  console.log("transactions");
  const accessToken = request.body.access_token;
  const transrequest = {
    access_token: accessToken,
    start_date: "2023-12-01",
    end_date: "2024-12-10",
  };

  try {
    console.log("transreq inside try");
    const response1 = await plaidClient.transactionsGet(transrequest);
    let transactions = response1.data.transactions;
    console.log("transac", transactions);
    const total_transactions = response1.data.total_transactions;
    // Manipulate the offset parameter to paginate
    // transactions and retrieve all available data
     response.json(transactions);
    // while (transactions.length < total_transactions) {
    //   const paginatedRequest = {
    //     access_token: accessToken,
    //     start_date: "2024-12-01",
    //     end_date: "2024-12-10",
    //     options: {
    //       offset: transactions.length,
    //     },
    //   };
    //   const paginatedResponse = await client.transactionsGet(paginatedRequest);
    //   transactions = transactions.concat(paginatedResponse.data.transactions);
    // }
  } catch (error) {
    console.log("error", error);
    response.status(500).send("failed");
  }
});

app.post("/exchange_public_token", async function (request, response, next) {
  const publicToken = request.body.public_token;
  try {
    const plaidResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    // These values should be saved to a persistent database and
    // associated with the currently signed-in user
    const accessToken = plaidResponse.data.access_token;
    response.json({ accessToken });
  } catch (error) {
    response.status(500).send("failed");
  }
});

app.listen(8000, () => {
  console.log("server has started");
});
