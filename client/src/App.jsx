import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";

import Home from "pages/home";
import Login from "pages/login";
import VerifyAccount from "pages/verify-account";
import Signup from "pages/signup";
import Profile from "pages/profile";
import Notifications from "pages/notifications";
import SavedPosts from "pages/saved-posts";
import Chat from "pages/messaging/chat";
import Messaging from "pages/messaging";
import ResetPassword from "pages/reset-password";
import Post from "pages/post";
import NotFound from "pages/NotFound";
import VerifyAccountByLink from "pages/VerifyAccountByLink";
import Welcome from "pages/welcome";
import Search from "pages/search";
import Header from "layout/header";
import PopupMessage from "components/popup-message";
import { HoverCardProvider } from "components/user-hover-card/HoverCardContext";
import { DialogProvider } from "components/dialog/DialogContext";
import { MediaViewerProvider } from "components/media-viewer/MediaViewerContext";

import useHandleSocket, { connectToSocketServer } from "hooks/useHandleSocket";
import useUpdate from "hooks/useUpdate";
import { setConversations } from "state";
import { useWindowWidth } from "hooks/useWindowWidth";
import Headroom from "react-headroom";

const App = () => {
  //if user is stored in redux state, then the user is logged in
  const { isLoggedin, isVerified, email, token } = useSelector(
    (state) => state.authStatus,
  );
  const theme = useSelector((state) => state.settings.theme);
  const dispatch = useDispatch();
  const windowWidth = useWindowWidth();
  /*
  this hook responsible for updating notifications and conversions
  and checking of authentication token once the app is loaded.
  */
  useUpdate();
  /*
  this hook responsible for handling realtime socket connections
  conversations, notifications and online contacts connections.
  */
  useHandleSocket();

  /*
  if the app started and the user is logged in then connect to 
  the socket server. 
  */
  useEffect(() => {
    if (isLoggedin) {
      connectToSocketServer();
    }
  }, []);

  useEffect(() => {
    /*
      the app's loading effect dependes on this variable, when the app
      loads for the first time then the loading effect will be triggered 
      after that it won't be triggered because of this variable.
    */
    if (isLoggedin) {
      sessionStorage.setItem("isLoaded", true);
    }
  }, [isLoggedin]);

  useEffect(() => {
    if (!sessionStorage.getItem("isLoaded")) {
      dispatch(setConversations([]));
    }
  }, []);

  return (
    <BrowserRouter>
      <div className={`App ${theme} bg-100`}>
        <DialogProvider>
          <MediaViewerProvider>
            <HoverCardProvider>
              {windowWidth >= 1024 && <Header />}
              {windowWidth < 1024 && (
                <Headroom>
                  <Header />
                </Headroom>
              )}
              <motion.main
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "linear" }}
              >
                <Routes>
                  <Route
                    path="/"
                    element={
                      isLoggedin && isVerified ? (
                        <Home />
                      ) : (
                        <Navigate to={"/login"} replace={true} />
                      )
                    }
                  />
                  <Route
                    path="/login"
                    element={
                      !isLoggedin ? (
                        <Login />
                      ) : isLoggedin && !isVerified ? (
                        <Navigate to="/verify-account" />
                      ) : (
                        <Navigate to="/" replace={true} />
                      )
                    }
                  />
                  <Route
                    path="/signup"
                    element={
                      !isLoggedin ? (
                        <Signup />
                      ) : (
                        <Navigate to="/" replace={true} />
                      )
                    }
                  />
                  <Route
                    path="/verify-account"
                    element={
                      isLoggedin && !isVerified ? (
                        <VerifyAccount />
                      ) : isLoggedin && (email || token) && isVerified ? (
                        <Navigate to="/welcome" replace={true} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/verify-account/:token"
                    element={
                      !isLoggedin || (isLoggedin && !isVerified) ? (
                        <VerifyAccountByLink />
                      ) : isLoggedin && (email || token) && isVerified ? (
                        <Navigate to="/welcome" replace={true} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/reset-password"
                    element={
                      !isLoggedin ? (
                        <ResetPassword />
                      ) : (
                        <Navigate to={"/"} replace={true} />
                      )
                    }
                  />
                  <Route
                    path="/reset-password/:token"
                    element={
                      !isLoggedin ? (
                        <ResetPassword />
                      ) : (
                        <Navigate to={"/"} replace={true} />
                      )
                    }
                  />
                  <Route
                    path="/welcome"
                    element={
                      isLoggedin && isVerified && email ? (
                        <Welcome />
                      ) : isLoggedin && !isVerified && email ? (
                        <Navigate to="/verify-account" replace={true} />
                      ) : (
                        <Navigate to="/" replace={true} />
                      )
                    }
                  />
                  <Route path="/post" element={<Post />} />
                  <Route
                    path="/notifications"
                    element={
                      isLoggedin && isVerified ? (
                        <Notifications />
                      ) : (
                        <Navigate to="/" replace={true} />
                      )
                    }
                  />
                  <Route
                    path="/messages"
                    element={
                      isLoggedin && isVerified ? (
                        <Messaging />
                      ) : (
                        <Navigate to="/" replace={true} />
                      )
                    }
                  >
                    <Route
                      path="/messages/contact/:conversationId"
                      element={<Chat />}
                    />
                    <Route path="/messages/user/:userId" element={<Chat />} />
                  </Route>
                  <Route
                    path="/saved-posts"
                    element={
                      isLoggedin && isVerified ? (
                        <SavedPosts />
                      ) : (
                        <Navigate to="/" replace={true} />
                      )
                    }
                  />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route
                    path="/search"
                    element={
                      isLoggedin && isVerified ? (
                        <Search />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <PopupMessage />
              </motion.main>
            </HoverCardProvider>
          </MediaViewerProvider>
        </DialogProvider>
      </div>
    </BrowserRouter>
  );
};
export default App;
