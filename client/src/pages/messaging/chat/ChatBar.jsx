import { useContext } from "react";
import { Link, useParams } from "react-router-dom";

import UserPicture from "components/UserPicture";

import { SelectedChatContext } from "..";
import useGetTime from "./messages-area/message/getTime";
import useFetchProfile from "hooks/useFetchProfile";

import ArrowLeftIcon from "assets/icons/arrow-left.svg?react";

const ChatBar = () => {
  const { userId } = useParams();
  const { participant, conversation } = useContext(SelectedChatContext);
  const [nonContactProfile] = useFetchProfile(userId);

  const lastSeenAt = useGetTime(participant?.lastSeenAt);

  return (
    <div className="bg-alt flex gap-2 py-2 shadow-lg">
      <Link to={"/messages"} className="block w-8 icon py-2">
        <ArrowLeftIcon fill="currentColor" />
      </Link>
      {!participant && !nonContactProfile && (
        <>
          <div className="circle w-12 loading"></div>
          <div className="flex flex-col justify-center gap-2">
            <span className="loading w-24 h-2 rounded-md"></span>
            <span className="loading w-16 h-2 rounded-md"></span>
          </div>
        </>
      )}
      {participant && (
        <>
          <span className="w-12">
            <UserPicture profile={participant} noCard />
          </span>
          <div className="flex flex-col justify-around">
            <Link
              to={`/profile/${participant.username}`}
              className="font-bold hover:underline"
            >
              {participant.firstName} {participant.lastName}
            </Link>
            {conversation?.isTyping ? (
              <span className="text-xs text-primary">Typing...</span>
            ) : (
              <>
                {participant?.isOnline && (
                  <span className="text-xs text-primary">Online</span>
                )}
                {!participant?.isOnline && (
                  <span className="text-xs text-gray-500">
                    Last seen {lastSeenAt}
                  </span>
                )}
              </>
            )}
          </div>
        </>
      )}

      {!participant && nonContactProfile && (
        <>
          <span className="w-12">
            <UserPicture profile={nonContactProfile} noCard />
          </span>
          <div className="flex flex-col justify-around">
            <Link
              to={`/profile/${nonContactProfile.username}`}
              className="font-bold hover:underline"
            >
              {nonContactProfile.firstName} {nonContactProfile.lastName}
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBar;
