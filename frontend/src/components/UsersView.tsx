import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';

const UsersView = () => {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => adminApi.getUsers(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading users</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Users Management</h2>
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Display Name</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user: any) => (
            <tr key={user.id}>
              <td className="py-2 px-4 border-b">{user.display_name}</td>
              <td className="py-2 px-4 border-b">{user.email}</td>
              <td className="py-2 px-4 border-b">{user.account_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersView;
