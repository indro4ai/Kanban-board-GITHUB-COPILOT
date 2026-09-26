"use client";

import { useRef, useState } from "react";
import {
  closestCorners,
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PencilLine, Plus, Trash2 } from "lucide-react";

type Card = {
  id: string;
  title: string;
  details: string;
};

type Column = {
  id: string;
  title: string;
  cardIds: string[];
};

const createId = (prefix: string, sequence: { current: number }) => {
  const id = `${prefix}-${sequence.current}`;
  sequence.current += 1;
  return id;
};

const initialCards: Record<string, Card> = {
  "card-1": {
    id: "card-1",
    title: "Prepare project brief",
    details: "Outline the appointment timeline, goals, and success metrics for the launch.",
  },
  "card-2": {
    id: "card-2",
    title: "Review design references",
    details: "Collect the visual examples that match the light, premium, and minimal brand direction.",
  },
  "card-3": {
    id: "card-3",
    title: "Create onboarding list",
    details: "Draft the first-pass checklist for setup, tool access, and deliverables.",
  },
  "card-4": {
    id: "card-4",
    title: "Confirm content outline",
    details: "Share the structure for the homepage and product content before production begins.",
  },
  "card-5": {
    id: "card-5",
    title: "Share sprint notes",
    details: "Document the meeting notes, open questions, and dependency updates for the team.",
  },
  "card-6": {
    id: "card-6",
    title: "Draft launch checklist",
    details: "Create the final quality check for visual polish, QA, and sign-off items.",
  },
};

const initialColumns: Column[] = [
  { id: "backlog", title: "Backlog", cardIds: ["card-1", "card-2"] },
  { id: "todo", title: "To Do", cardIds: ["card-3", "card-4"] },
  { id: "in-progress", title: "In Progress", cardIds: ["card-5"] },
  { id: "review", title: "Review", cardIds: [] },
  { id: "done", title: "Done", cardIds: ["card-6"] },
];

function CardItem({
  card,
  onDelete,
  onUpdate,
}: {
  card: Card;
  onDelete: (cardId: string) => void;
  onUpdate: (cardId: string, field: "title" | "details", value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition ${
        isDragging ? "opacity-60 shadow-md" : "opacity-100"
      }`}
    >
      <div className="mb-2 flex items-start gap-2">
        <button
          type="button"
          className="mt-1 rounded-lg p-1 text-[#888888] transition hover:bg-slate-100 hover:text-[#032147]"
          aria-label={`Drag ${card.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>

        <input
          aria-label={`Card title for ${card.title}`}
          value={card.title}
          onChange={(event) => onUpdate(card.id, "title", event.target.value)}
          className="w-full border-b border-transparent bg-transparent text-sm font-semibold text-[#032147] outline-none transition focus:border-[#209dd7]"
          placeholder="Card title"
        />

        <button
          type="button"
          onClick={() => onDelete(card.id)}
          className="rounded-lg p-1 text-[#888888] transition hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${card.title}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <textarea
        aria-label={`Card details for ${card.title}`}
        value={card.details}
        onChange={(event) => onUpdate(card.id, "details", event.target.value)}
        className="min-h-20 w-full resize-none border-0 bg-transparent text-sm leading-6 text-[#5f6f7c] outline-none placeholder:text-slate-400"
        placeholder="Add details..."
      />
    </article>
  );
}

function ColumnCard({
  column,
  cards,
  onRenameColumn,
  onAddCard,
  onDeleteCard,
  onUpdateCard,
}: {
  column: Column;
  cards: Record<string, Card>;
  onRenameColumn: (columnId: string, title: string) => void;
  onAddCard: (columnId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCard: (cardId: string, field: "title" | "details", value: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[420px] w-full min-w-[270px] max-w-[320px] flex-col rounded-3xl border bg-[#f9fafb] p-4 shadow-sm transition ${
        isOver ? "border-[#209dd7] bg-[#f3f9fe]" : "border-slate-200"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ecad0a]" />
          <input
            aria-label={`${column.title} column title`}
            value={column.title}
            onChange={(event) => onRenameColumn(column.id, event.target.value)}
            className="w-full bg-transparent text-base font-semibold text-[#032147] outline-none placeholder:text-slate-400"
          />
        </div>

        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-[#032147] px-2 py-1 text-xs font-semibold text-white">
          {column.cardIds.length}
        </span>
      </div>

      <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-3">
          {column.cardIds.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-[#888888]">
              Drop a card here
            </div>
          ) : (
            column.cardIds.map((cardId) => (
              <CardItem
                key={cardId}
                card={cards[cardId]}
                onDelete={onDeleteCard}
                onUpdate={onUpdateCard}
              />
            ))
          )}
        </div>
      </SortableContext>

      <button
        type="button"
        onClick={() => onAddCard(column.id)}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#753991] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#653579]"
      >
        <Plus size={16} />
        Add card
      </button>
    </div>
  );
}

export default function Home() {
  const [cards, setCards] = useState<Record<string, Card>>(initialCards);
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const nextCardId = useRef(7);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const findColumnByCardId = (cardId: string) =>
    columns.find((column) => column.cardIds.includes(cardId));

  const renameColumn = (columnId: string, title: string) => {
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? { ...column, title: title || "Untitled column" } : column,
      ),
    );
  };

  const addCard = (columnId: string) => {
    const cardId = createId("card", nextCardId);
    const newCard: Card = {
      id: cardId,
      title: "New task",
      details: "Add more details...",
    };

    setCards((currentCards) => ({ ...currentCards, [cardId]: newCard }));
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? { ...column, cardIds: [...column.cardIds, cardId] } : column,
      ),
    );
  };

  const deleteCard = (cardId: string) => {
    setCards((currentCards) => {
      const nextCards = { ...currentCards };
      delete nextCards[cardId];
      return nextCards;
    });

    setColumns((currentColumns) =>
      currentColumns.map((column) => ({
        ...column,
        cardIds: column.cardIds.filter((id) => id !== cardId),
      })),
    );
  };

  const updateCard = (cardId: string, field: "title" | "details", value: string) => {
    setCards((currentCards) => ({
      ...currentCards,
      [cardId]: {
        ...currentCards[cardId],
        [field]: value,
      },
    }));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) {
      return;
    }

    const sourceColumn = findColumnByCardId(activeId);
    const targetColumn =
      findColumnByCardId(overId) ?? columns.find((column) => column.id === overId);

    if (!sourceColumn || !targetColumn) {
      return;
    }

    const sourceIndex = sourceColumn.cardIds.indexOf(activeId);
    const targetIndex =
      overId === targetColumn.id ? targetColumn.cardIds.length : targetColumn.cardIds.indexOf(overId);

    if (sourceColumn.id === targetColumn.id) {
      const reordered = arrayMove(sourceColumn.cardIds, sourceIndex, targetIndex);
      setColumns((currentColumns) =>
        currentColumns.map((column) =>
          column.id === sourceColumn.id ? { ...column, cardIds: reordered } : column,
        ),
      );
      return;
    }

    const nextSourceColumn = [...sourceColumn.cardIds];
    nextSourceColumn.splice(sourceIndex, 1);

    const nextTargetColumn = [...targetColumn.cardIds];
    nextTargetColumn.splice(Math.max(0, targetIndex), 0, activeId);

    setColumns((currentColumns) =>
      currentColumns.map((column) => {
        if (column.id === sourceColumn.id) {
          return { ...column, cardIds: nextSourceColumn };
        }

        if (column.id === targetColumn.id) {
          return { ...column, cardIds: nextTargetColumn };
        }

        return column;
      }),
    );
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(32,157,215,0.12),_transparent_34%),linear-gradient(180deg,_#f5f8fc_0%,_#edf4fa_100%)] px-4 py-8 text-[#032147] md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#209dd7]">
              Project flow
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#032147]">Kanban Board MVP</h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#ecad0a]/40 bg-[#ecad0a]/10 px-3 py-2 text-sm font-medium text-[#032147]">
            <PencilLine size={16} className="text-[#209dd7]" />
            Rename any column to fit your process
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 overflow-x-auto pb-4">
            {columns.map((column) => (
              <ColumnCard
                key={column.id}
                column={column}
                cards={cards}
                onRenameColumn={renameColumn}
                onAddCard={addCard}
                onDeleteCard={deleteCard}
                onUpdateCard={updateCard}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </main>
  );
}
