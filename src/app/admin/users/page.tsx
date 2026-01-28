import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
    return (
        <>
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">User Manager</h1>
            </div>
            <Card>
                 <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>Manage user roles and status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>User list and management tools will be displayed here.</p>
                </CardContent>
            </Card>
        </>
    )
}
