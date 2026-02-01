import { createContext } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import Time from "components/time";
import UserPicture from "pages/messaging/UserPicture";
import Status from "pages/messaging/chat/messages-area/message/Status";
import OptionsBtn from "./options-btn";

export const ConversationContext = createContext();

const Conversation = ({ conversation }) => {
  const { conversationId } = useParams();
  const myProfile = useSelector((state) => state.profile);
  const contacts = useSelector((state) => state.contacts);
  const theme = useSelector((state) => state.settings.theme);

  const participantId = conversation.participants?.find(
    (participant) => participant?._id !== myProfile._id,
  )._id;
  const participant = contacts.find((contact) => contact._id === participantId);
  const { unreadMessagesCount } = conversation;
  const lastMessage = conversation.messages[0];
  const isOnline = useSelector((state) => state.contacts).find(
    (contact) => contact._id === participantId,
  )?.isOnline;

  // if (!participant) {
  //   return null;
  // }

  return (
    <ConversationContext.Provider value={{ participant }}>
      <div
        className={`group block ${
          conversationId === conversation._id ? "bg-alt" : ""
        } bg-hovered p-2 sm:p-3 rounded-xl transition-all duration-200 hover:shadow-sm`}
      >
        <div className="flex items-center gap-2 relative">
          {/* User Picture - Fixed width on all screens */}
          <Link to={`contact/${conversation._id}`} className="flex-shrink-0">
            <UserPicture profile={participant} isOnline={isOnline} />
          </Link>

          {/* Main Content - Flexible width */}
          <Link
            to={`contact/${conversation._id}`}
            className="flex-1 min-w-0 flex flex-col justify-center"
          >
            {/* Top row: Name and unread count */}
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`truncate ${
                  unreadMessagesCount > 0 ? "font-semibold" : "font-medium"
                } text-sm sm:text-base`}
              >
                {participant?.firstName} {participant?.lastName}
              </div>
              {unreadMessagesCount > 0 && (
                <div className="flex-shrink-0 w-5 h-5 bg-primary text-white text-xs circle flex items-center justify-center font-medium">
                  {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                </div>
              )}
            </div>

            {/* Bottom row: Message preview and time */}
            <div className="flex items-center justify-between gap-2">
              <div
                className={`flex-1 min-w-0 text-xs sm:text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <div className="truncate">
                  {!lastMessage && "No Messages."}
                  {lastMessage?.senderId === myProfile._id && (
                    <span className="font-medium">You: </span>
                  )}
                  {lastMessage?.text && (
                    <span className="truncate">
                      {lastMessage.text.length > 30
                        ? `${lastMessage.text.slice(0, 30)}...`
                        : lastMessage.text}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {lastMessage?.senderId === myProfile._id && (
                  <Status info={lastMessage.info} />
                )}
                <Time
                  date={conversation.updatedAt}
                  withDate
                  className="text-xs text-gray-500"
                />
              </div>
            </div>
          </Link>

          {/* Options Button - Hidden on mobile, visible on hover for larger screens */}
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
            <OptionsBtn conversationId={conversation._id} />
          </div>

          {/* Mobile options button - always visible on small screens */}
          <div className="flex-shrink-0 sm:hidden">
            <OptionsBtn conversationId={conversation._id} />
          </div>
        </div>
      </div>
    </ConversationContext.Provider>
  );
};

export default Conversation;
