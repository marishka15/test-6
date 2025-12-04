import "./styles.css";

function getInitialState() {
  const saved = localStorage.getItem("trelloState");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse localStorage data", e);
    }
  }
  return {
    columns: [
      {
        id: "todo",
        title: "TODO",
        cards: [{ id: "1", text: "Welcome to Trello!" }],
      },
      { id: "inprogress", title: "IN PROGRESS", cards: [] },
      { id: "done", title: "DONE", cards: [] },
    ],
  };
}

let state = getInitialState();

function saveState() {
  localStorage.setItem("trelloState", JSON.stringify(state));
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const board = document.createElement("div");
  board.className = "board";

  state.columns.forEach((col) => {
    const columnEl = document.createElement("div");
    columnEl.className = "column";
    columnEl.dataset.id = col.id;

    const titleEl = document.createElement("h2");
    titleEl.textContent = col.title;
    columnEl.append(titleEl);

    const cardsContainer = document.createElement("div");
    cardsContainer.className = "cards";
    cardsContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });
    cardsContainer.addEventListener("drop", (e) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData("text/plain");
      if (cardId) {
        moveCardToColumn(cardId, col.id);
      }
    });

    col.cards.forEach((card) => {
      const cardEl = document.createElement("div");
      cardEl.className = "card";
      cardEl.dataset.id = card.id;
      cardEl.draggable = true;
      cardEl.textContent = card.text;

      // Удаляем при наведении — крестик
      const deleteIcon = document.createElement("span");
      deleteIcon.className = "delete-icon";
      deleteIcon.textContent = "×";
      deleteIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteCard(card.id, col.id);
      });
      cardEl.append(deleteIcon);

      cardEl.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", card.id);
        e.dataTransfer.effectAllowed = "move";
        cardEl.classList.add("dragging"); // ← для cursor: grabbing
      });

      cardEl.addEventListener("dragend", (e) => {
        cardEl.classList.remove("dragging");
      });

      cardsContainer.append(cardEl);
    });

    columnEl.append(cardsContainer);

    // Кнопка добавления
    const addBtn = document.createElement("button");
    addBtn.className = "add-card-btn";
    addBtn.textContent = "+ Add another card";
    addBtn.addEventListener("click", () => openAddForm(col.id, columnEl));
    columnEl.append(addBtn);

    board.append(columnEl);
  });

  app.append(board);
}

function deleteCard(cardId, columnId) {
  state.columns = state.columns.map((col) => {
    if (col.id === columnId) {
      return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
    }
    return col;
  });
  saveState();
  render();
}

function openAddForm(columnId, columnEl) {
  // Убираем предыдущие формы
  const existing = document.querySelector(".add-card-form");
  if (existing) {
    existing.remove();
    return;
  }

  const addBtn = columnEl.querySelector(".add-card-btn");
  const form = document.createElement("div");
  form.className = "add-card-form";
  form.innerHTML = `
    <textarea class="add-card-input" placeholder="Enter a title for this card..." rows="2"></textarea>
    <div class="add-card-actions">
      <button class="add-card-save">Add Card</button>
      <button class="add-card-cancel">×</button>
    </div>
  `;

  const input = form.querySelector(".add-card-input");
  const saveBtn = form.querySelector(".add-card-save");
  const cancelBtn = form.querySelector(".add-card-cancel");

  input.focus();

  saveBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (text) {
      const newCard = { id: Date.now().toString(), text };
      state.columns = state.columns.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col,
      );
      saveState();
      render();
    }
  });

  cancelBtn.addEventListener("click", () => form.remove());

  columnEl.insertBefore(form, addBtn);
}

function moveCardToColumn(cardId, targetColumnId) {
  let card = null;
  state.columns = state.columns.map((col) => {
    const idx = col.cards.findIndex((c) => c.id === cardId);
    if (idx !== -1) {
      card = col.cards[idx];
      return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
    }
    return col;
  });

  if (card) {
    state.columns = state.columns.map((col) =>
      col.id === targetColumnId ? { ...col, cards: [...col.cards, card] } : col,
    );
  }

  saveState();
  render();
}

document.addEventListener("DOMContentLoaded", render);
