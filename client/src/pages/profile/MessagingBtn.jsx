import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import MessagesIcon from "assets/icons/message-text.svg?react";

const MessagingBtn = (props) => {
  const { id: accountToMessageId } = props;
  const myProfile = useSelector((state) => state.profile);
  const contacts = useSelector((state) => state.contacts);
  const contact = contacts.find((con) => con._id === accountToMessageId);
  const link = contact
    ? `/messages/contact/${contact.conversationId}`
    : `/messages/user/${accountToMessageId}`;

  return (
    <>
      {/* only show "follow toggle" button for loggedin user */}
      {myProfile && accountToMessageId !== myProfile._id && (
        <Link to={link} className="circle p-1 ">
          <MessagesIcon className="text-primary w-7" />
        </Link>
      )}
    </>
  );
};

export default MessagingBtn;
