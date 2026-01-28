import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function AdminPromptsPage() {
    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Prompt Manager</h1>
                <Button asChild>
                    <Link href="/admin/prompts/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Prompt
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Prompts</CardTitle>
                    <CardDescription>A list of all prompts in the marketplace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Prompt list and management tools will be displayed here.</p>
                </CardContent>
            </Card>
        </>
    )
}