
import { UserSearch } from "lucide-react";

type Props = {
  onClick: () => void;
};

export default function FindTeamMemberButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#009bd4] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <UserSearch size={16} />
      Find Team Member
    </button>
  );
}
