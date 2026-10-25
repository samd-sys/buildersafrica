import { UserSearch } from "lucide-react";

type Props = {
  onClick: () => void;
};

export default function FindTeamMemberButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-gray transition-all hover:bg-[#00AFEF] hover:shadow-gray active:scale-[0.98]"
    >
      <UserSearch size={16} />
      Find Team Member
    </button>
  );
}