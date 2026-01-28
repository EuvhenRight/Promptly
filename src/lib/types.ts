import { Timestamp } from "firebase/firestore";

export type Cart = {
    id: string;
    userId: string;
    promptIds: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
