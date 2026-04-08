import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

interface User {
  id: string
  email: string
  role: "admin" | "creator" | "voter"
  createdAt: string
}

interface UserTableProps {
  users: User[]
  onRoleChange: (userId: string, newRole: string) => Promise<void>
  isLoading?: boolean
}

export const UserTable = ({ users, onRoleChange, isLoading = false }: UserTableProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleRoleChange = (user: User, role: string) => {
    setSelectedUser(user)
    setNewRole(role)
    setIsDialogOpen(true)
  }

  const handleConfirm = async () => {
    if (!selectedUser) return

    setIsUpdating(true)
    try {
      await onRoleChange(selectedUser.id, newRole)
      setIsDialogOpen(false)
      setSelectedUser(null)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Current Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell className="capitalize">{user.role}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(role) => handleRoleChange(user, role)}
                  disabled={isLoading || isUpdating}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voter">Voter</SelectItem>
                    <SelectItem value="creator">Creator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Change User Role?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to change {selectedUser?.email} from{" "}
            <span className="font-semibold capitalize">{selectedUser?.role}</span> to{" "}
            <span className="font-semibold capitalize">{newRole}</span>?
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default UserTable
