import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const { TRELLO_API_KEY: key, TRELLO_TOKEN: token } = process.env;

const TASK_BOARD_ID = "65578301e147e89a553d84da";
const DAVE_MEMBER_ID = "627a9909636f054753097839";

async function fetchListsOnTaskBoard() {
  const response = await fetch(
    `https://api.trello.com/1/boards/${TASK_BOARD_ID}/lists?key=${key}&token=${token}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );
  return await response.json();
}

async function fetchCardsInProgress(listID) {
  const response = await fetch(
    `https://api.trello.com/1/lists/${listID}/cards/?customFieldItems=true&key=${key}&token=${token}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );
  return await response.json();
}

async function completeGHField(url = "test") {
  const lists = await fetchListsOnTaskBoard();
  const inProgressList = lists.filter(
    (list) => list.name == "🟢 In Progress"
  )[0];
  let myCards = await fetchCardsInProgress(inProgressList.id);
  myCards = myCards.filter((card) => card.idMembers.includes(DAVE_MEMBER_ID));

  if (myCards.length !== 1) {
    console.log("well this isn't right!");
  }
  let myCard = myCards[0];

  let customFields = await fetch(
    `https://api.trello.com/1/boards/${TASK_BOARD_ID}?customFields=true&key=${key}&token=${token}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );
  let result = await customFields.json();
  const githubField = result.customFields.filter(
    (field) => field.name === "github"
  )[0];

  await fetch(
    `https://api.trello.com/1/cards/${myCard.id}/customField/${githubField.id}/item?key=${key}&token=${token}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: {
          text: url,
        },
      }),
    }
  );
}
export default completeGHField;
