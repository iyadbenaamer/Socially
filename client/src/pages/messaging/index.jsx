import { createContext, useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { setUnreadMessagesCount } from "state";

import Sidebar from "layout/sidebar";
import Bar from "layout/bar";
import Contact from "./contact";
import Conversations from "./conversations";

import { useWindowWidth } from "hooks/useWindowWidth";

export const SelectedChatContext = createContext();

const Messaging = () => {
  const { conversationId, userId } = useParams();
  const windowWidth = useWindowWidth();

  const myProfile = useSelector((state) => state.profile);
  const dispatch = useDispatch();

  const contacts = useSelector((state) => state.contacts);
  const onlineContactsIds = useMemo(
    () => contacts.filter((contact) => contact.isOnline),
    [contacts],
  );
  const offlineContactsIds = useMemo(
    () => contacts.filter((contact) => !contact.isOnline),
    [contacts],
  );
  const conversations = useSelector((state) => state.conversations);
  const conversation = conversations?.find(
    (conv) => conv._id === conversationId,
  );
  const participantId = conversation?.participants.find(
    (part) => part._id !== myProfile._id,
  )._id;

  // to fetch the other participant's info in the conversation
  let participant = contacts.find((contact) => contact._id === participantId);

  // for all conversations
  const unreadMessagesCount = useSelector((state) => state.unreadMessagesCount);

  // this removes the unread messages count label on the conversations logo
  useEffect(() => {
    if (unreadMessagesCount) {
      dispatch(setUnreadMessagesCount(0));
    }
  }, [conversation]);

  return (
    <>
      <SelectedChatContext.Provider
        value={{
          conversation,
          participant,
        }}
      >
        {/*the chat is taking the entire screen for small screens*/}
        {windowWidth < 768 && (conversationId || userId) && (
          <div
            className="fixed left-0 z-20 w-full"
            style={{
              height: "calc(100svh - 95px)",
            }}
          >
            <Outlet />
          </div>
        )}
        <>
          <div className="grid grid-cols-12">
            {windowWidth >= 1024 && (
              <div className="sidebar pt-5 flex justify-center col-span-3">
                <Sidebar />
              </div>
            )}
            <div
              style={{
                height:
                  windowWidth >= 1024
                    ? "calc(100svh - 45px)"
                    : "calc(100svh - 95px)",
              }}
              className="content messaging bg-200 col-span-12 lg:col-span-9 md:mx-0 grid grid-cols-3 h-[calc(100svh - 45px)] overflow-hidden"
            >
              <div
                className="col-span-3 md:col-span-1 md:col-start-1 flex flex-col "
                style={{
                  height: "calc(100svh - 45px)",
                }}
              >
                <div className="contacts">
                  <div className="w-full pt-2 pb-4 lg:pt-6 px-4 lg:pb-5 text-2xl">
                    Messages
                  </div>
                  <div
                    className="contacts flex items-center w-full overflow-x-scroll"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {onlineContactsIds.map((contact) => (
                      <Contact key={contact._id} {...contact} />
                    ))}
                    {offlineContactsIds.map((contact) => (
                      <Contact key={contact._id} {...contact} />
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <Conversations />
                </div>
              </div>
              {/* for large screens the chat will take a part of 
                the screen rather than the entire screen */}
              {windowWidth >= 768 && (
                <div className="overflow-hidden col-span-3 md:col-span-2 md:col-start-2 bg-200 h-full">
                  <Outlet />
                </div>
              )}
            </div>
          </div>
          {windowWidth < 1024 && <Bar />}
        </>
      </SelectedChatContext.Provider>
    </>
  );
};
export default Messaging;
