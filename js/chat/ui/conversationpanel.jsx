// libs
var React = require("react");
var ReactDOM = require("react-dom");
var utils = require('./../../ui/utils.jsx');
var RenderDebugger = require('./../../stores/mixins.js').RenderDebugger;
var MegaRenderMixin = require('./../../stores/mixins.js').MegaRenderMixin;
var ButtonsUI = require('./../../ui/buttons.jsx');
var ModalDialogsUI = require('./../../ui/modalDialogs.jsx');
var CloudBrowserModalDialog = require('./../../ui/cloudBrowserModalDialog.jsx');
var DropdownsUI = require('./../../ui/dropdowns.jsx');
var ContactsUI = require('./../ui/contacts.jsx');
var ConversationsUI = require('./../ui/conversations.jsx');
var TypingAreaUI = require('./../ui/typingArea.jsx');
var WhosTyping = require('./whosTyping.jsx').WhosTyping;
var getMessageString = require('./messages/utils.jsx').getMessageString;
var PerfectScrollbar = require('./../../ui/perfectScrollbar.jsx').PerfectScrollbar;
var ParticipantsList = require('./participantsList.jsx').ParticipantsList;

var GenericConversationMessage = require('./messages/generic.jsx').GenericConversationMessage;
var AlterParticipantsConversationMessage =
    require('./messages/alterParticipants.jsx').AlterParticipantsConversationMessage;
var TruncatedMessage = require('./messages/truncated.jsx').TruncatedMessage;
var PrivilegeChange = require('./messages/privilegeChange.jsx').PrivilegeChange;
var TopicChange = require('./messages/topicChange.jsx').TopicChange;




var ConversationRightArea = React.createClass({
    mixins: [MegaRenderMixin],
    getDefaultProps: function() {
        return {
            'requiresUpdateOnResize': true
        }
    },
    allContactsInChat: function(participants) {
        var self = this;
        if (participants.length === 0) {
            return false;
        }

        var currentContacts = self.props.contacts;
        var foundNonMembers = 0;
        currentContacts.forEach(function(u, k) {
            if (u.c === 1) {
                if (participants.indexOf(k) === -1) {
                    foundNonMembers++;
                }
            }
        });

        if (foundNonMembers > 0) {
            return false;
        }
        else {
            return true;
        }
    },
    render: function() {
        var self = this;
        var room = this.props.chatRoom;

        if (!room || !room.roomId) {
            // destroyed
            return null;
        }
        var contactHandle;
        var contact;
        var contacts = room.getParticipantsExceptMe();
        if (contacts && contacts.length > 0) {
            contactHandle = contacts[0];
            contact = M.u[contactHandle];
        }
        else {
            contact = {};
        }



        // room is not active, don't waste DOM nodes, CPU and Memory (and save some avatar loading calls...)
        if (!room.isCurrentlyActive && !self._wasAppendedEvenOnce) {
            return null;
        }
        self._wasAppendedEvenOnce = true;

        var myPresence = room.megaChat.userPresenceToCssClass(M.u[u_handle].presence);

        var disabledCalls = room.isReadOnly() || !room.chatId || room.callManagerCall;


        var startAudioCallButtonClass = "";
        var startVideoCallButtonClass = "";

        if (disabledCalls) {
            startAudioCallButtonClass = startVideoCallButtonClass = "disabled";
        }

        var startAudioCallButton =
            <div className={"link-button" + " " + startVideoCallButtonClass} onClick={() => {
                if (!disabledCalls) {
                    room.startAudioCall();
                }
            }}>
                <i className="small-icon audio-call"></i>
                {__(l[5896])}
            </div>;

        var startVideoCallButton =
            <div className={"link-button" + " " + startVideoCallButtonClass} onClick={() => {
                if (!disabledCalls) {
                    room.startVideoCall();
                }
            }}>
                <i className="small-icon video-call"></i>
                {__(l[5897])}
            </div>;
        var AVseperator = <div className="chat-button-seperator"></div>;
        var endCallButton =
                    <div className={"link-button red" + (!contact.presence? " disabled" : "")} onClick={() => {
                        if (contact.presence && contact.presence !== "offline") {
                            if (room.callManagerCall) {
                                room.callManagerCall.endCall();
                            }
                        }
                    }}>
            <i className="small-icon horizontal-red-handset"></i>
            {__(l[5884])}
        </div>;


        if (room.callManagerCall && room.callManagerCall.isActive() === true) {
            startAudioCallButton = startVideoCallButton = null;
        } else {
            endCallButton = null;
        }



        var isReadOnlyElement = null;

        if (room.isReadOnly()) {
            // isReadOnlyElement = <span className="center">(read only chat)</span>;
        }
        var excludedParticipants = room.type === "group" ?
            (
                room.members && Object.keys(room.members).length > 0 ? Object.keys(room.members) :
                    room.getParticipants()
            )   :
            room.getParticipants();

        if (excludedParticipants.indexOf(u_handle) >= 0) {
            array.remove(excludedParticipants, u_handle, false);
        }
        var dontShowTruncateButton = false;
        if (
            !room.iAmOperator() ||
            room.isReadOnly() ||
            room.messagesBuff.messages.length === 0 ||
            (
                room.messagesBuff.messages.length === 1 &&
                room.messagesBuff.messages.getItem(0).dialogType === "truncated"
            )
        ) {
            dontShowTruncateButton = true;
        }

        var membersHeader = null;

        if (room.type === "group") {
            membersHeader = <div className="chat-right-head">
                <div className="chat-grey-counter">
                    {Object.keys(room.members).length}
                </div>
                <div className="chat-right-head-txt">
                    {__(l[8876])}
                </div>
            </div>
        }

        // console.error(
        //     self.findDOMNode(),
        //     excludedParticipants,
        //         self.allContactsInChat(excludedParticipants),
        //         room.isReadOnly(),
        //         room.iAmOperator(),
        //     myPresence === 'offline'
        // );

        var renameButtonClass = "link-button " + (
            room.isReadOnly() || !room.iAmOperator() ?
                "disabled" : ""
            );

        return <div className="chat-right-area">
            <div className="chat-right-area conversation-details-scroll">
                <div className="chat-right-pad">

                    {isReadOnlyElement}
                    {membersHeader}
                    <ParticipantsList
                        chatRoom={room}
                        members={room.members}
                        isCurrentlyActive={room.isCurrentlyActive}
                    />
                    <ButtonsUI.Button
                        className="add-chat-contact"
                        label={__(l[8007])}
                        contacts={this.props.contacts}
                        disabled={
                            /* Disable in case I don't have any more contacts to add ... */
                            !(
                                !self.allContactsInChat(excludedParticipants) &&
                                !room.isReadOnly() &&
                                room.iAmOperator()
                            )
                        }
                        >
                        <DropdownsUI.DropdownContactsSelector
                            contacts={this.props.contacts}
                            megaChat={this.props.megaChat}
                            chatRoom={room}
                            exclude={
                                excludedParticipants
                            }
                            multiple={true}
                            className="popup add-participant-selector"
                            singleSelectedButtonLabel={__(l[8869])}
                            multipleSelectedButtonLabel={__(l[8869])}
                            nothingSelectedButtonLabel={__(l[8870])}
                            onSelectDone={this.props.onAddParticipantSelected}
                            positionMy="center top"
                            positionAt="left bottom"
                            />
                    </ButtonsUI.Button>
                    <div className="buttons-block">
                        <div className="chat-right-head-txt">
                            Options
                        </div>
                        {room.type !== "group" ? startAudioCallButton : null}
                        {room.type !== "group" ? startVideoCallButton : null}
                        {room.type !== "group" ? AVseperator : null}
                        {
                            room.type == "group" ?
                            (
                                <div className={renameButtonClass}
                                     onClick={(e) => {
                                         if ($(e.target).closest('.disabled').size() > 0) {
                                             return false;
                                         }
                                         if (self.props.onRenameClicked) {
                                            self.props.onRenameClicked();
                                         }
                                }}>
                                    <i className="small-icon writing-pen"></i>
                                    {__(l[9080])}
                                </div>
                            ) : null
                        }

                        <ButtonsUI.Button
                            className="link-button dropdown-element"
                            icon="rounded-grey-up-arrow"
                            label={__(l[6834] + "...")}
                            disabled={room.isReadOnly()}
                            >
                            <DropdownsUI.Dropdown
                                contacts={this.props.contacts}
                                megaChat={this.props.megaChat}
                                className="wide-dropdown send-files-selector"
                                onClick={() => {}}
                            >
                                <DropdownsUI.DropdownItem icon="grey-cloud" label={__(l[8013])} onClick={() => {
                                    self.props.onAttachFromCloudClicked();
                                }} />
                                <DropdownsUI.DropdownItem icon="grey-computer" label={__(l[8014])} onClick={() => {
                                    self.props.onAttachFromComputerClicked();
                                }} />
                            </DropdownsUI.Dropdown>
                        </ButtonsUI.Button>

                        {endCallButton}

                        {
                            <div className={"link-button " + (dontShowTruncateButton ? "disabled" : "")}
                                 onClick={(e) => {
                                     if ($(e.target).closest('.disabled').size() > 0) {
                                         return false;
                                     }
                                     if (self.props.onTruncateClicked) {
                                        self.props.onTruncateClicked();
                                     }
                            }}>
                                <i className="small-icon clear-arrow"></i>
                                {__(l[8871])}
                            </div>
                        }
                        {<div className="chat-button-seperator"></div>}
                        {
                            <div className={"link-button"}
                                 onClick={(e) => {
                                    if ($(e.target).closest('.disabled').size() > 0) {
                                        return false;
                                    }
                                    if (room.isArchived()) {
                                        if (self.props.onUnarchiveClicked) {
                                           self.props.onUnarchiveClicked();
                                        }
                                    } else {
                                        if (self.props.onArchiveClicked) {
                                           self.props.onArchiveClicked();
                                        }
                                    }
                            }}>
                                <i className={"small-icon " +  ((room.isArchived()) ? "unarchive" : "archive")}></i>
                                {room.isArchived() ? __(l[19065]) : __(l[16689])}
                            </div>
                        }
                        { room.type === "group" ? (
                            <div className={"link-button red " + (
                                    room.stateIsLeftOrLeaving() ? "disabled" : ""
                                )}
                                 onClick={(e) => {
                                     if ($(e.target).closest('.disabled').size() > 0) {
                                         return false;
                                     }
                                     if (self.props.onLeaveClicked) {
                                        self.props.onLeaveClicked();
                                     }
                            }}>
                                <i className="small-icon rounded-stop"></i>
                                {l[8633]}
                            </div>
                        ) : null
                        }
                        { room._closing !== true && room.type === "group" && room.stateIsLeftOrLeaving() ? (
                            <div className="link-button red" onClick={() => {
                                if (self.props.onCloseClicked) {
                                    self.props.onCloseClicked();
                                }
                            }}>
                                <i className="small-icon rounded-stop"></i>
                                {l[148]}
                            </div>
                        ) : null
                        }
                    </div>
                </div>
            </div>
        </div>
    }
});



var ConversationAudioVideoPanel = React.createClass({
    mixins: [MegaRenderMixin],
    getInitialState: function() {
        return {
            'messagesBlockEnabled': false,
            'fullScreenModeEnabled': false,
            'localMediaDisplay': true
        }
    },
    _hideBottomPanel: function() {
        var self = this;
        var room = self.props.chatRoom;
        if (!room.callManagerCall || !room.callManagerCall.isActive()) {
            return;
        }

        var $container = $(ReactDOM.findDOMNode(self));

        self.visiblePanel = false;
        $('.call.bottom-panel, .call.local-video, .call.local-audio', $container).removeClass('visible-panel');
    },
    componentDidUpdate: function() {
        var self = this;
        var room = self.props.chatRoom;
        if (!room.callManagerCall || !room.callManagerCall.isActive()) {
            return;
        }

        var $container = $(ReactDOM.findDOMNode(self));


        var mouseoutThrottling = null;
        $container.rebind('mouseover.chatUI' + self.props.chatRoom.roomId, function() {
            var $this = $(this);
            clearTimeout(mouseoutThrottling);
            self.visiblePanel = true;
            $('.call.bottom-panel, .call.local-video, .call.local-audio', $container).addClass('visible-panel');
            if ($this.hasClass('full-sized-block')) {
                $('.call.top-panel', $container).addClass('visible-panel');
            }
        });

        $container.rebind('mouseout.chatUI' + self.props.chatRoom.roomId, function() {
            var $this = $(this);
            clearTimeout(mouseoutThrottling);
            mouseoutThrottling = setTimeout(function() {
                self.visiblePanel = false;
                self._hideBottomPanel();
                $('.call.top-panel', $container).removeClass('visible-panel');
            }, 500);
        });


        // Hidding Control panel if cursor is idle
        var idleMouseTimer;
        var forceMouseHide = false;
        $container.rebind('mousemove.chatUI' + self.props.chatRoom.roomId,function(ev) {
            var $this = $(this);
            if (self._bottomPanelMouseOver) {
                return;
            }
            clearTimeout(idleMouseTimer);
            if (!forceMouseHide) {
                self.visiblePanel = true;
                $('.call.bottom-panel, .call.local-video, .call.local-audio', $container).addClass('visible-panel');
                $container.removeClass('no-cursor');
                if ($this.hasClass('full-sized-block')) {
                    $('.call.top-panel', $container).addClass('visible-panel');
                }
                idleMouseTimer = setTimeout(function() {
                    self.visiblePanel = false;

                    self._hideBottomPanel();

                    $container.addClass('no-cursor');
                    $('.call.top-panel', $container).removeClass('visible-panel');

                    forceMouseHide = true;
                    setTimeout(function() {
                        forceMouseHide = false;
                    }, 400);
                }, 2000);
            }
        });

        $('.call.bottom-panel', $container).rebind('mouseenter.chatUI' + self.props.chatRoom.roomId,function(ev) {
            self._bottomPanelMouseOver = true;
            clearTimeout(idleMouseTimer);
        });
        $('.call.bottom-panel', $container).rebind('mouseleave.chatUI' + self.props.chatRoom.roomId,function(ev) {
            self._bottomPanelMouseOver = false;

            idleMouseTimer = setTimeout(function() {
                self.visiblePanel = false;

                self._hideBottomPanel();

                $container.addClass('no-cursor');
                $('.call.top-panel', $container).removeClass('visible-panel');

                forceMouseHide = true;
                setTimeout(function() {
                    forceMouseHide = false;
                }, 400);
            }, 2000);
        });


        $(document)
            .unbind("fullscreenchange.megaChat_" + room.roomId)
            .bind("fullscreenchange.megaChat_" + room.roomId, function() {
                if (!$(document).fullScreen() && room.isCurrentlyActive) {
                    self.setState({fullScreenModeEnabled: false});
                }
                else if (!!$(document).fullScreen() && room.isCurrentlyActive) {
                    self.setState({fullScreenModeEnabled: true});
                }
                self.forceUpdate();
            });

        var $localMediaDisplay = $('.call.local-video, .call.local-audio', $container);
        $localMediaDisplay.draggable({
            'refreshPositions': true,
            'containment': $container,
            'scroll': false,
            drag: function(event, ui){
                if ($(this).is(".minimized")) {
                    return false;
                }

                var right = Math.max(0, $container.outerWidth() - ui.position.left);
                var bottom = Math.max(0, $container.outerHeight() - ui.position.top);


                // contain in the $container
                right = Math.min(right, $container.outerWidth() - 8);
                bottom = Math.min(bottom, $container.outerHeight() - 8);

                right = right - ui.helper.outerWidth();
                bottom = bottom - ui.helper.outerHeight();

                var minBottom = $(this).is(".minimized") ? 48 : 8;

                if (bottom < minBottom) {
                    bottom = minBottom;
                    $(this).addClass('bottom-aligned');
                }
                else {
                    $(this).removeClass('bottom-aligned');
                }

                if (right < 8) {
                    right = 8;
                    $(this).addClass('right-aligned');
                }
                else {
                    $(this).removeClass('right-aligned');
                }

                ui.offset = {
                    left: 'auto',
                    top: 'auto',
                    right: right,
                    bottom: bottom,
                    height: "",
                    width: ""
                };
                ui.position.left = 'auto';
                ui.position.top = 'auto';

                ui.helper.css(ui.offset);
                $(this).css(ui.offset);
            }
        });

        // REposition the $localMediaDisplay if its OUT of the viewport (in case of dragging -> going back to normal
        // size mode from full screen...)
        $(window).rebind('resize.chatUI_' + room.roomId, function(e) {
            if ($container.is(":visible")) {
                if (!elementInViewport($localMediaDisplay[0])) {
                    $localMediaDisplay
                        .addClass('right-aligned')
                        .addClass('bottom-aligned')
                        .css({
                            'right': 8,
                            'bottom': 8,
                        });
                }
            }
        });


        if (
            self.refs.remoteVideo &&
            self.refs.remoteVideo.src === "" &&
            self.refs.remoteVideo.currentTime === 0 &&
            !self.refs.remoteVideo.srcObject
        ) {
            var participants = room.getParticipantsExceptMe();
            var stream = room.callManagerCall._streams[participants[0]];
            RTC.attachMediaStream(self.refs.remoteVideo, stream);
            // attachMediaStream would do the .play call
        }

        if (
            room.megaChat.rtc &&
            room.megaChat.rtc.gLocalStream &&
            self.refs.localViewport &&
            self.refs.localViewport.src === "" &&
            self.refs.localViewport.currentTime === 0 &&
            !self.refs.localViewport.srcObject
        ) {
            RTC.attachMediaStream(self.refs.localViewport, room.megaChat.rtc.gLocalStream);
            // attachMediaStream would do the .play call
        }

        $(room).rebind('toggleMessages.av', function() {
            self.toggleMessages();
        });

        room.messagesBlockEnabled = self.state.messagesBlockEnabled;
    },
    componentWillUnmount: function() {
        var self = this;
        var room = self.props.chatRoom;

        var $container = $(ReactDOM.findDOMNode(self));
        if ($container) {
            $container.unbind('mouseover.chatUI' + self.props.chatRoom.roomId);
            $container.unbind('mouseout.chatUI' + self.props.chatRoom.roomId);
            $container.unbind('mousemove.chatUI' + self.props.chatRoom.roomId);
        }

        $(document).unbind("fullscreenchange.megaChat_" + room.roomId);
        $(window).unbind('resize.chatUI_' + room.roomId);
        $(room).unbind('toggleMessages.av');
    },
    toggleMessages: function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }


        if (this.props.onMessagesToggle) {
            this.props.onMessagesToggle(
                !this.state.messagesBlockEnabled
            );
        }

        this.setState({
            'messagesBlockEnabled': !this.state.messagesBlockEnabled
        });
    },
    fullScreenModeToggle: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var newVal = !this.state.fullScreenModeEnabled;
        $(document).fullScreen(newVal);

        this.setState({
            'fullScreenModeEnabled': newVal,
            'messagesBlockEnabled': newVal === true ? false : this.state.messagesBlockEnabled
        });
    },
    toggleLocalVideoDisplay: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $container = $(ReactDOM.findDOMNode(this));
        var $localMediaDisplay = $('.call.local-video, .call.local-audio', $container);

        $localMediaDisplay
            .addClass('right-aligned')
            .addClass('bottom-aligned')
            .css({
                'width': '',
                'height': '',
                'right': 8,
                'bottom': !this.state.localMediaDisplay === true ? 8 : 8
            });

        this.setState({localMediaDisplay: !this.state.localMediaDisplay});
    },
    render: function() {
        var chatRoom = this.props.chatRoom;

        if (!chatRoom.callManagerCall || !chatRoom.callManagerCall.isStarted()) {
            return null;
        }

        var participants = chatRoom.getParticipantsExceptMe();

        var displayNames = [];

        participants.forEach(function(v) {
            displayNames.push(
                htmlentities(M.getNameByHandle(v))
            );
        });


        var callManagerCall = chatRoom.callManagerCall;

        var remoteCamEnabled = null;


        if (callManagerCall.getRemoteMediaOptions().video) {
            remoteCamEnabled = <i className="small-icon blue-videocam" />;
        }


        var localPlayerElement = null;
        var remotePlayerElement = null;

        var visiblePanelClass = "";
        var localPlayerStream;
        if (callManagerCall && chatRoom.megaChat.rtc && chatRoom.megaChat.rtc.gLocalStream) {
            localPlayerStream = chatRoom.megaChat.rtc.gLocalStream;
        }

        if (this.visiblePanel === true) {
            visiblePanelClass += " visible-panel";
        }
        if (!localPlayerStream || callManagerCall.getMediaOptions().video === false) {
            localPlayerElement = <div className={
                "call local-audio right-aligned bottom-aligned" +
                (this.state.localMediaDisplay ? "" : " minimized ") +
                visiblePanelClass
            }>
                <div className="default-white-button tiny-button call" onClick={this.toggleLocalVideoDisplay}>
                    <i className="tiny-icon grey-minus-icon" />
                </div>
                <ContactsUI.Avatar
                    contact={M.u[u_handle]} className="call avatar-wrapper semi-big-avatar"
                    style={{display: !this.state.localMediaDisplay ? "none" : ""}}
                />
            </div>;
        }
        else {
            localPlayerElement = <div
                className={
                    "call local-video right-aligned bottom-aligned" +
                    (this.state.localMediaDisplay ? "" : " minimized ") +
                    visiblePanelClass
                }>
                <div className="default-white-button tiny-button call" onClick={this.toggleLocalVideoDisplay}>
                    <i className="tiny-icon grey-minus-icon"/>
                </div>
                <video
                    ref="localViewport"
                    className="localViewport"
                    defaultMuted={true}
                    muted={true}
                    volume={0}
                    id={"localvideo_" + callManagerCall.id}
                    style={{display: !this.state.localMediaDisplay ? "none" : ""}}

                />
            </div>;
        }

        var remotePlayerStream = callManagerCall._streams[participants[0]];

        if (
            !remotePlayerStream ||
            callManagerCall.getRemoteMediaOptions().video === false
        ) {
            // TODO: When rtc is ready
            var contact = M.u[participants[0]];
            remotePlayerElement = <div className="call user-audio">
                <ContactsUI.Avatar contact={contact}  className="avatar-wrapper big-avatar" hideVerifiedBadge={true} />
            </div>;
        }
        else {
            remotePlayerElement = <div className="call user-video">
                <video
                    autoPlay={true}
                    className="rmtViewport rmtVideo"
                    id={"remotevideo_" + callManagerCall.id}
                    ref="remoteVideo"
                />
            </div>;
        }


        var unreadDiv = null;
        var unreadCount = chatRoom.messagesBuff.getUnreadCount();
        if (unreadCount > 0) {
            unreadDiv = <div className="unread-messages">{unreadCount > 9 ? "9+" : unreadCount}</div>
        }

        var additionalClass = "";
        additionalClass = (this.state.fullScreenModeEnabled === true ? " full-sized-block" : "");
        if (additionalClass.length === 0) {
            additionalClass = (this.state.messagesBlockEnabled === true ? " small-block" : "");
        }
        return <div className={"call-block" + additionalClass} id="call-block">
            {remotePlayerElement}
            {localPlayerElement}


            <div className="call top-panel">
                <div className="call top-user-info">
                    <span className="user-card-name white">{displayNames.join(", ")}</span>{remoteCamEnabled}
                </div>
                <div
                    className="call-duration medium blue call-counter"
                    data-room-id={chatRoom.chatId}>{
                    secondsToTimeShort(chatRoom._currentCallCounter)
                    }
                </div>
            </div>


            <div className="call bottom-panel">
                <div className={"button call left" + (unreadDiv ? " unread" : "")} onClick={this.toggleMessages}>
                    {unreadDiv}
                    <i className="big-icon conversations"></i>
                </div>
                <div className="button call" onClick={function(e) {
                    if (callManagerCall.getMediaOptions().audio === true) {
                        callManagerCall.muteAudio();
                    }
                    else {
                        callManagerCall.unmuteAudio();
                    }
                }}>
                    <i className={
                        "big-icon " + (callManagerCall.getMediaOptions().audio ? " microphone" : " crossed-microphone")
                    }></i>
                </div>
                <div className="button call" onClick={function(e) {
                    if (callManagerCall.getMediaOptions().video === true) {
                        callManagerCall.muteVideo();
                    }
                    else {
                        callManagerCall.unmuteVideo();
                    }
                }}>
                    <i className={
                        "big-icon " + (callManagerCall.getMediaOptions().video ? " videocam" : " crossed-videocam")
                    }></i>
                </div>
                <div className="button call" onClick={function(e) {
                        if (chatRoom.callManagerCall) {
                            chatRoom.callManagerCall.endCall();
                        }
                    }}>
                    <i className="big-icon horizontal-red-handset"></i>
                </div>
                <div className="button call right" onClick={this.fullScreenModeToggle}>
                    <i className="big-icon nwse-resize"></i>
                </div>
            </div>
        </div>;
    }
});
var ConversationPanel = React.createClass({
    mixins: [MegaRenderMixin, RenderDebugger],
    lastScrollPositionPerc: 1,
    getInitialState: function() {
        return {
            startCallPopupIsActive: false,
            localVideoIsMinimized: false,
            isFullscreenModeEnabled: false,
            mouseOverDuringCall: false,
            attachCloudDialog: false,
            messagesToggledInCall: false,
            sendContactDialog: false,
            confirmDeleteDialog: false,
            pasteImageConfirmDialog: false,
            messageToBeDeleted: null,
            editing: false
        };
    },

    uploadFromComputer: function() {
        this.scrolledToBottom = true;

        this.props.chatRoom.uploadFromComputer();
    },
    refreshUI: function() {
        var self = this;
        var room = self.props.chatRoom;

        if (!self.props.chatRoom.isCurrentlyActive) {
            return;
        }

        room.renderContactTree();

        room.megaChat.refreshConversations();

        room.trigger('RefreshUI');
    },

    onMouseMove: SoonFc(function(e) {
        var self = this;
        var chatRoom = self.props.chatRoom;
        if (self.isMounted()) {
            chatRoom.trigger("onChatIsFocused");
        }
    }, 150),

    handleKeyDown: SoonFc(function(e) {
        var self = this;
        var chatRoom = self.props.chatRoom;
        if (self.isMounted() && chatRoom.isActive() && !chatRoom.isReadOnly()) {
            chatRoom.trigger("onChatIsFocused");
        }
    }, 150),
    componentDidMount: function() {
        var self = this;
        window.addEventListener('resize', self.handleWindowResize);
        window.addEventListener('keydown', self.handleKeyDown);

        self.props.chatRoom.rebind('call-ended.jspHistory call-declined.jspHistory', function (e, eventData) {
            self.callJustEnded = true;
        });

        self.props.chatRoom.rebind('onSendMessage.scrollToBottom', function (e, eventData) {
            self.scrolledToBottom = true;
            if (self.messagesListScrollable) {
                self.messagesListScrollable.scrollToBottom();
            }
        });
        self.props.chatRoom.rebind('openSendFilesDialog', function(e) {
            self.setState({'attachCloudDialog': true});
        });

        self.eventuallyInit();
    },
    eventuallyInit: function(doResize) {
        var self = this;

        // because..JSP would hijack some DOM elements, we need to wait with this...
        if (self.initialised) {
            return;
        }
        var $container = $(self.findDOMNode());

        if ($container.length > 0) {
            self.initialised = true;
        }

        self.$messages = $('.messages.scroll-area > .perfectScrollbarContainer', $container);


        var droppableConfig = {
            tolerance: 'pointer',
            drop: function(e, ui)
            {
                $.doDD(e,ui,'drop',1);
            },
            over: function (e, ui)
            {
                $.doDD(e,ui,'over',1);
            },
            out: function (e, ui)
            {
                $.doDD(e,ui,'out',1);
            }
        };

        self.$messages.droppable(droppableConfig);

        self.lastScrollPosition = null;
        self.lastScrolledToBottom = true;
        self.lastScrollHeight = 0;
        self.lastUpdatedScrollHeight = 0;

        var room = self.props.chatRoom;

        // collapse on ESC pressed (exited fullscreen)
        $(document)
            .unbind("fullscreenchange.megaChat_" + room.roomId)
            .bind("fullscreenchange.megaChat_" + room.roomId, function() {
                if (!$(document).fullScreen() && room.isCurrentlyActive) {
                    self.setState({isFullscreenModeEnabled: false});
                }
                else if (!!$(document).fullScreen() && room.isCurrentlyActive) {
                    self.setState({isFullscreenModeEnabled: true});
                }
                self.forceUpdate();
            });

        if (doResize !== false) {
            self.handleWindowResize();
        }
    },
    componentWillMount: function() {
        var self = this;
        var chatRoom = self.props.chatRoom;
        var megaChat = self.props.chatRoom.megaChat;

        $(chatRoom).rebind('onHistoryDecrypted.cp', function() {
            self.eventuallyUpdate();
        });
    },
    componentWillUnmount: function() {
        var self = this;
        var chatRoom = self.props.chatRoom;
        var megaChat = chatRoom.megaChat;

        window.removeEventListener('resize', self.handleWindowResize);
        window.removeEventListener('keydown', self.handleKeyDown);
        $(document).unbind("fullscreenchange.megaChat_" + chatRoom.roomId);
    },
    componentDidUpdate: function(prevProps, prevState) {
        var self = this;
        var room = this.props.chatRoom;

        self.eventuallyInit(false);

        room.megaChat.updateSectionUnreadCount();

        var $node = $(self.findDOMNode());

        if (self.loadingShown) {
            $('.js-messages-loading', $node).removeClass('hidden');
        }
        else {
            $('.js-messages-loading', $node).addClass('hidden');
        }
        self.handleWindowResize();

        if (prevState.messagesToggledInCall !== self.state.messagesToggledInCall || self.callJustEnded) {
            if (self.callJustEnded) {
                self.callJustEnded = false;
            }
            self.$messages.trigger('forceResize', [
                true,
                1
            ]);
            Soon(function() {
                self.messagesListScrollable.scrollToBottom(true);
            });
        }

        if (prevProps.isActive === false && self.props.isActive === true) {
            var $typeArea = $('.messages-textarea:visible:first', $node);
            if ($typeArea.size() === 1) {
                $typeArea.focus();
                moveCursortoToEnd($typeArea[0]);
            }
        }
        if (!prevState.renameDialog && self.state.renameDialog === true) {
            var $input = $('.chat-rename-dialog input');
            $input.focus();
            $input[0].selectionStart = 0;
            $input[0].selectionEnd = $input.val().length;
        }

        if (prevState.editing === false && self.state.editing !== false) {
            if (self.messagesListScrollable) {
                self.messagesListScrollable.reinitialise(false);
                // wait for the reinit...
                Soon(function() {
                    if (self.editDomElement && self.editDomElement.size() === 1) {
                        self.messagesListScrollable.scrollToElement(self.editDomElement[0], false);
                    }
                });
            }
        }

        if (self.isMounted() && self.$messages && self.isComponentEventuallyVisible()) {
            $(window).rebind('pastedimage.chatRoom', function (e, blob, fileName) {
                if (self.isMounted() && self.$messages && self.isComponentEventuallyVisible()) {
                    self.setState({'pasteImageConfirmDialog': [blob, fileName, URL.createObjectURL(blob)]});
                    e.preventDefault();
                }
            });
        }
    },
    handleWindowResize: function(e, scrollToBottom) {
        var $container = $(ReactDOM.findDOMNode(this));
        var self = this;

        self.eventuallyInit(false);

        if (!self.isMounted() || !self.$messages || !self.isComponentEventuallyVisible()) {
            return;
        }

        // Important. Please insure we have correct height detection for Chat messages block.
        // We need to check ".fm-chat-input-scroll" instead of ".fm-chat-line-block" height
        var scrollBlockHeight = (
            $('.chat-content-block', $container).outerHeight() -
            $('.chat-topic-block', $container).outerHeight() -
            $('.call-block', $container).outerHeight() -
            $('.chat-textarea-block', $container).outerHeight()
        );

        if (scrollBlockHeight != self.$messages.outerHeight()) {
            self.$messages.css('height', scrollBlockHeight);
            $('.messages.main-pad', self.$messages).css('min-height', scrollBlockHeight);
            self.refreshUI(true);
        }
        else {
            self.refreshUI(scrollToBottom);
        }
    },
    isActive: function() {
        return document.hasFocus() && this.$messages && this.$messages.is(":visible");
    },
    onMessagesScrollReinitialise: function(
                            ps,
                            $elem,
                            forced,
                            scrollPositionYPerc,
                            scrollToElement
                ) {
        var self = this;
        var chatRoom = self.props.chatRoom;
        var mb = chatRoom.messagesBuff;

        // don't do anything if history is being retrieved at the moment.
        if (self.isRetrievingHistoryViaScrollPull || mb.isRetrievingHistory) {
            return;
        }

        if (forced) {
            if (!scrollPositionYPerc && !scrollToElement) {
                if (self.scrolledToBottom && !self.editDomElement) {
                    ps.scrollToBottom(true);
                    return true;
                }
            }
            else {
                // don't do anything if the UI was forced to scroll to a specific pos.
                return;
            }
        }

        if (self.isComponentEventuallyVisible()) {
            if (self.scrolledToBottom && !self.editDomElement) {
                ps.scrollToBottom(true);
                return true;
            }
            if (self.lastScrollPosition !== ps.getScrollPositionY() && !self.editDomElement) {
                ps.scrollToY(self.lastScrollPosition, true);
                return true;
            }

        }
    },
    onMessagesScrollUserScroll: function(
                        ps,
                        $elem,
                        e
    ) {
        var self = this;

        var scrollPositionY = ps.getScrollPositionY();
        var isAtTop = ps.isAtTop();
        var isAtBottom = ps.isAtBottom();
        var chatRoom = self.props.chatRoom;
        var mb = chatRoom.messagesBuff;

        if (mb.messages.length === 0) {
            self.props.chatRoom.scrolledToBottom = self.scrolledToBottom = true;
            return;
        }

        // turn on/off auto scroll to bottom.
        if (ps.isCloseToBottom(30) === true) {
            if (!self.scrolledToBottom) {
                mb.detachMessages();
            }
            self.props.chatRoom.scrolledToBottom = self.scrolledToBottom = true;
        }
        else {
            self.props.chatRoom.scrolledToBottom = self.scrolledToBottom = false;
        }


        if (isAtTop || (ps.getScrollPositionY() < 5 && ps.getScrollHeight() > 500)) {
            if (mb.haveMoreHistory() && !self.isRetrievingHistoryViaScrollPull && !mb.isRetrievingHistory) {
                ps.disable();



                self.isRetrievingHistoryViaScrollPull = true;
                self.lastScrollPosition = scrollPositionY;

                self.lastContentHeightBeforeHist = ps.getScrollHeight();
                // console.error('start:', self.lastContentHeightBeforeHist, self.lastScrolledToBottom);


                var msgsAppended = 0;
                $(chatRoom).unbind('onMessagesBuffAppend.pull');
                $(chatRoom).bind('onMessagesBuffAppend.pull', function() {
                    msgsAppended++;

                    // var prevPosY = (
                    //     ps.getScrollHeight() - self.lastContentHeightBeforeHist
                    // ) + self.lastScrollPosition;
                    //
                    //
                    // ps.scrollToY(
                    //     prevPosY,
                    //     true
                    // );
                    //
                    // self.lastContentHeightBeforeHist = ps.getScrollHeight();
                    // self.lastScrollPosition = prevPosY;
                });

                $(chatRoom).unbind('onHistoryDecrypted.pull');
                $(chatRoom).one('onHistoryDecrypted.pull', function(e) {
                    $(chatRoom).unbind('onMessagesBuffAppend.pull');
                    var prevPosY = (
                        ps.getScrollHeight() - self.lastContentHeightBeforeHist
                    ) + self.lastScrollPosition;

                    ps.scrollToY(
                        prevPosY,
                        true
                    );

                    // wait for all msgs to be rendered.
                    chatRoom.messagesBuff.addChangeListener(function() {
                        if (msgsAppended > 0) {
                            var prevPosY = (
                                ps.getScrollHeight() - self.lastContentHeightBeforeHist
                            ) + self.lastScrollPosition;

                            ps.scrollToY(
                                prevPosY,
                                true
                            );

                            self.lastScrollPosition = prevPosY;
                        }

                        delete self.lastContentHeightBeforeHist;

                        return 0xDEAD;
                    });

                    setTimeout(function() {
                        self.isRetrievingHistoryViaScrollPull = false;
                        // because of mousewheel animation, we would delay the re-enabling of the "pull to load
                        // history", so that it won't re-trigger another hist retrieval request

                        ps.enable();
                        self.forceUpdate();
                    }, 1150);

                });

                mb.retrieveChatHistory();
            }
        }

        if (self.lastScrollPosition !== ps.getScrollPositionY()) {
            self.lastScrollPosition = ps.getScrollPositionY();
        }


    },
    specificShouldComponentUpdate: function() {
        if (
            this.isRetrievingHistoryViaScrollPull ||
            this.loadingShown ||
            (this.props.chatRoom.messagesBuff.messagesHistoryIsLoading() && this.loadingShown) ||
            (
                this.props.chatRoom.messagesBuff.isDecrypting &&
                this.props.chatRoom.messagesBuff.isDecrypting.state() === 'pending' &&
                this.loadingShown
            ) ||
            (
                this.props.chatRoom.messagesBuff.isDecrypting &&
                this.props.chatRoom.messagesBuff.isDecrypting.state() === 'pending' &&
                this.loadingShown
            ) ||
            !this.props.chatRoom.isCurrentlyActive
        ) {
            return false;
        }
        else {
            return undefined;
        }
    },
    render: function() {
        var self = this;

        var room = this.props.chatRoom;
        if (!room || !room.roomId) {
            return null;
        }
        // room is not active, don't waste DOM nodes, CPU and Memory (and save some avatar loading calls...)
        if (!room.isCurrentlyActive && !self._wasAppendedEvenOnce) {
            return null;
        }
        self._wasAppendedEvenOnce = true;

        var contacts = room.getParticipantsExceptMe();
        var contactHandle;
        var contact;
        var avatarMeta;
        var contactName = "";
        if (contacts && contacts.length === 1) {
            contactHandle = contacts[0];
            contact = M.u[contactHandle];
            avatarMeta = contact ? generateAvatarMeta(contact.u) : {};
            contactName = avatarMeta.fullName;
        }
        else if (contacts && contacts.length > 1) {
            contactName = room.getRoomTitle(true);

        }

        var conversationPanelClasses = "conversation-panel " + room.type + "-chat";

        if (!room.isCurrentlyActive) {
            conversationPanelClasses += " hidden";
        }





        var messagesList = [
        ];

        if (
            (
                ChatdIntegration._loadingChats[room.roomId] &&
                ChatdIntegration._loadingChats[room.roomId].loadingPromise &&
                ChatdIntegration._loadingChats[room.roomId].loadingPromise.state() === 'pending'
            ) ||
            (self.isRetrievingHistoryViaScrollPull && !self.loadingShown) ||
            room.messagesBuff.messagesHistoryIsLoading() === true ||
            room.messagesBuff.joined === false ||
            (
                room.messagesBuff.joined === true &&
                room.messagesBuff.haveMessages === true &&
                room.messagesBuff.messagesHistoryIsLoading() === true
            ) ||
            (
                room.messagesBuff.isDecrypting &&
                room.messagesBuff.isDecrypting.state() === 'pending'
            )
        ) {
            self.loadingShown = true;
        }
        else if (
            room.messagesBuff.joined === true
        ) {
            if (!self.isRetrievingHistoryViaScrollPull && room.messagesBuff.haveMoreHistory() === false) {
                var headerText = (
                    room.messagesBuff.messages.length === 0 ?
                        __(l[8002]) :
                        __(l[8002])
                );

                headerText = headerText.replace("%s", "<span>" + htmlentities(contactName) + "</span>");

                messagesList.push(
                    <div className="messages notification" key="initialMsg">
                        <div className="header" dangerouslySetInnerHTML={{__html: headerText}}>
                        </div>
                        <div className="info">
                            {__(l[8080])}
                            <p>
                                <i className="semi-big-icon grey-lock"></i>
                                <span dangerouslySetInnerHTML={{
                                    __html: __(l[8540])
                                        .replace("[S]", "<strong>")
                                        .replace("[/S]", "</strong>")
                                }}></span>
                            </p>
                            <p>
                                <i className="semi-big-icon grey-tick"></i>
                                <span dangerouslySetInnerHTML={{
                                    __html: __(l[8539])
                                        .replace("[S]", "<strong>")
                                        .replace("[/S]", "</strong>")
                                }}></span>
                            </p>
                        </div>
                    </div>
                );
            }

            delete self.loadingShown;
        }
        else {
            delete self.loadingShown;
        }


        var lastTimeMarker;
        var lastMessageFrom = null;
        var lastGroupedMessageTimeStamp = null;
        var lastMessageState = null;
        var grouped = false;

        room.messagesBuff.messages.forEach(function(v, k) {
            if (!v.protocol && v.revoked !== true) {
                var shouldRender = true;
                if (
                    (
                        v.isManagement &&
                        v.isManagement() === true &&
                        v.isRenderableManagement() === false
                    ) ||
                    v.deleted === true
                ) {
                    shouldRender = false;
                }

                var timestamp = v.delay;
                var curTimeMarker;
                var iso = (new Date(timestamp * 1000).toISOString());
                if (todayOrYesterday(iso)) {
                    // if in last 2 days, use the time2lastSeparator
                    curTimeMarker = time2lastSeparator(iso);
                }
                else {
                    // if not in the last 2 days, use 1st June [Year]
                    curTimeMarker = acc_time2date(timestamp, true);
                }
                var currentState = v.getState ? v.getState() : null;

                if (shouldRender === true && curTimeMarker && lastTimeMarker !== curTimeMarker) {
                    lastTimeMarker = curTimeMarker;
                    messagesList.push(
                        <div className="message date-divider" key={v.messageId + "_marker"}>{curTimeMarker}</div>
                    );

                    grouped = false;
                    lastMessageFrom = null;
                    lastGroupedMessageTimeStamp = null;
                    lastMessageState = false;
                }


                if (shouldRender === true) {
                    var userId = v.userId;
                    if (!userId) {
                        // dialogMessage have .authorContact instead of .userId
                        if (contact && contact.u) {
                            userId = contact.u;
                        }
                    }

                    if (
                        (v instanceof Message) &&
                        (v.keyid !== 0)
                    ) {

                        // the grouping logic for messages.
                        if (!lastMessageFrom || (userId && lastMessageFrom === userId)) {
                            if (timestamp - lastGroupedMessageTimeStamp < (5 * 60)) {
                                grouped = true;
                            }
                            else {
                                grouped = false;
                                lastMessageFrom = userId;
                                lastGroupedMessageTimeStamp = timestamp;
                                lastMessageState = currentState;
                            }
                        }
                        else {
                            grouped = false;
                            lastMessageFrom = userId;
                            if (lastMessageFrom === userId) {
                                lastGroupedMessageTimeStamp = timestamp;
                            }
                            else {
                                lastGroupedMessageTimeStamp = null;
                            }
                        }
                    }
                    else {
                        grouped = false;
                        lastMessageFrom = null;
                        lastGroupedMessageTimeStamp = null;
                    }
                }

                if (
                    v.dialogType === "remoteCallEnded" &&
                    v &&
                    v.wrappedChatDialogMessage
                ) {
                    v = v.wrappedChatDialogMessage;
                }


                if (v.dialogType) {
                    var messageInstance = null;
                    if (v.dialogType === 'alterParticipants') {
                        messageInstance = <AlterParticipantsConversationMessage
                            message={v}
                            key={v.messageId}
                            contact={M.u[v.userId]}
                            grouped={grouped}
                        />
                    }
                    else if (v.dialogType === 'truncated') {
                        messageInstance = <TruncatedMessage
                            message={v}
                            key={v.messageId}
                            contact={M.u[v.userId]}
                            grouped={grouped}
                        />
                    }
                    else if (v.dialogType === 'privilegeChange') {
                        messageInstance = <PrivilegeChange
                            message={v}
                            key={v.messageId}
                            contact={M.u[v.userId]}
                            grouped={grouped}
                        />
                    }
                    else if (v.dialogType === 'topicChange') {
                        messageInstance = <TopicChange
                            message={v}
                            key={v.messageId}
                            contact={M.u[v.userId]}
                            grouped={grouped}
                        />
                    }

                    messagesList.push(messageInstance);
                }
                else {
                    if (!v.chatRoom) {
                        // ChatDialogMessages...
                        v.chatRoom = room;
                    }

                    messagesList.push(
                        <GenericConversationMessage
                            message={v}
                            state={v.state}
                            key={v.messageId}
                            contact={contact}
                            grouped={grouped}
                            onUpdate={() => {
                                self.onResizeDoUpdate();
                            }}
                            editing={self.state.editing === v.messageId || self.state.editing === v.pendingMessageId}
                            onEditStarted={($domElement) => {
                                self.editDomElement = $domElement;
                                self.setState({'editing': v.messageId});
                                self.forceUpdate();
                            }}
                            onEditDone={(messageContents) => {
                                self.editDomElement = null;

                                var currentContents = v.textContents;

                                v.edited = false;

                                if (messageContents === false || messageContents === currentContents) {
                                    self.messagesListScrollable.scrollToBottom(true);
                                    self.lastScrollPositionPerc = 1;
                                }
                                else if (messageContents) {
                                    $(room).trigger('onMessageUpdating', v);
                                    room.megaChat.plugins.chatdIntegration.updateMessage(
                                        room,
                                        v.internalId ? v.internalId : v.orderValue,
                                        messageContents
                                    );
                                    if (
                                        v.getState &&
                                        (
                                            v.getState() === Message.STATE.NOT_SENT ||
                                            v.getState() === Message.STATE.SENT
                                        ) &&
                                        !v.requiresManualRetry
                                    ) {
                                        if (v.textContents) {
                                            v.textContents = messageContents;
                                        }
                                        if (v.emoticonShortcutsProcessed) {
                                            v.emoticonShortcutsProcessed = false;
                                        }
                                        if (v.emoticonsProcessed) {
                                            v.emoticonsProcessed = false;
                                        }
                                        if (v.messageHtml) {
                                            delete v.messageHtml;
                                        }


                                        $(v).trigger(
                                            'onChange',
                                            [
                                                v,
                                                "textContents",
                                                "",
                                                messageContents
                                            ]
                                        );

                                        megaChat.plugins.richpreviewsFilter.processMessage({}, v);
                                    }

                                    self.messagesListScrollable.scrollToBottom(true);
                                    self.lastScrollPositionPerc = 1;
                                }
                                else if (messageContents.length === 0) {

                                    self.setState({
                                        'confirmDeleteDialog': true,
                                        'messageToBeDeleted': v
                                    });
                                }

                                self.setState({'editing': false});
                            }}
                            onDeleteClicked={(e, msg) => {
                                self.setState({
                                    'editing': false,
                                    'confirmDeleteDialog': true,
                                    'messageToBeDeleted': msg
                                });
                                self.forceUpdate();
                            }}
                        />
                    );
                }
            }
        });

        var attachCloudDialog = null;
        if (self.state.attachCloudDialog === true) {
            var selected = [];
            attachCloudDialog = <CloudBrowserModalDialog.CloudBrowserDialog
                folderSelectNotAllowed={true}
                onClose={() => {
                    self.setState({'attachCloudDialog': false});
                    selected = [];
                }}
                onSelected={(nodes) => {
                    selected = nodes;
                }}
                onAttachClicked={() => {
                    self.setState({'attachCloudDialog': false});

                    self.scrolledToBottom = true;

                    room.attachNodes(
                        selected
                    );
                }}
            />
        }

        var sendContactDialog = null;
        if (self.state.sendContactDialog === true) {
            var excludedContacts = [];
            if (room.type == "private") {
                room.getParticipantsExceptMe().forEach(function(userHandle) {
                    var contact = M.u[userHandle];
                    if (contact) {
                        excludedContacts.push(
                            contact.u
                        );
                    }
                });
            }

            sendContactDialog = <ModalDialogsUI.SelectContactDialog
                megaChat={room.megaChat}
                chatRoom={room}
                exclude={excludedContacts}
                contacts={M.u}
                onClose={() => {
                    self.setState({'sendContactDialog': false});
                    selected = [];
                }}
                onSelectClicked={(selected) => {
                    self.setState({'sendContactDialog': false});

                    room.attachContacts(selected);
                }}
            />
        }

        var confirmDeleteDialog = null;
        if (self.state.confirmDeleteDialog === true) {
            confirmDeleteDialog = <ModalDialogsUI.ConfirmDialog
                megaChat={room.megaChat}
                chatRoom={room}
                title={__(l[8004])}
                name="delete-message"
                onClose={() => {
                    self.setState({'confirmDeleteDialog': false});
                }}
                onConfirmClicked={() => {
                    var msg = self.state.messageToBeDeleted;
                    if (!msg) {
                        return;
                    }
                    var chatdint = room.megaChat.plugins.chatdIntegration;
                    if (msg.getState() === Message.STATE.SENT ||
                        msg.getState() === Message.STATE.DELIVERED ||
                        msg.getState() === Message.STATE.NOT_SENT) {
                        chatdint.deleteMessage(room, msg.internalId ? msg.internalId : msg.orderValue);
                        msg.deleted = true;
                        msg.textContents = "";
                        room.messagesBuff.removeMessageById(msg.messageId);
                    }
                    else if (
                        msg.getState() === Message.STATE.NOT_SENT_EXPIRED
                    ) {
                        chatdint.discardMessage(room, msg.internalId ? msg.internalId : msg.orderValue);
                    }


                    self.setState({
                        'confirmDeleteDialog': false,
                        'messageToBeDeleted': false
                    });

                    if (
                        msg.getState &&
                        msg.getState() === Message.STATE.NOT_SENT &&
                        !msg.requiresManualRetry
                    ) {
                        msg.message = "";
                        msg.textContents = "";
                        msg.messageHtml = "";
                        msg.deleted = true;

                        $(msg).trigger(
                            'onChange',
                            [
                                msg,
                                "deleted",
                                false,
                                true
                            ]
                        );
                    }

                }}
            >
                <div className="fm-dialog-content">

                    <div className="dialog secondary-header">
                        {__(l[8879])}
                    </div>

                    <GenericConversationMessage
                        className="dialog-wrapper"
                        message={self.state.messageToBeDeleted}
                        hideActionButtons={true}
                        initTextScrolling={true}
                    />
                </div>
            </ModalDialogsUI.ConfirmDialog>
        }

        var pasteImageConfirmDialog = null;
        if (self.state.pasteImageConfirmDialog) {
            confirmDeleteDialog = <ModalDialogsUI.ConfirmDialog
                megaChat={room.megaChat}
                chatRoom={room}
                title={__("Confirm paste")}
                name="paste-image-chat"
                onClose={() => {
                    self.setState({'pasteImageConfirmDialog': false});
                }}
                onConfirmClicked={() => {
                    var meta = self.state.pasteImageConfirmDialog;
                    if (!meta) {
                        return;
                    }

                    try {
                        Object.defineProperty(meta[0], 'name', {
                            configurable: true,
                            writeable: true,
                            value: Date.now() + '.' + M.getSafeName(meta[1] || meta[0].name)
                        });
                    }
                    catch (e) {}

                    self.scrolledToBottom = true;

                    M.addUpload([meta[0]]);

                    self.setState({
                        'pasteImageConfirmDialog': false
                    });

                    URL.revokeObjectURL(meta[2]);
                }}
            >
                <div className="fm-dialog-content">

                    <div className="dialog secondary-header">
                        {__("Please confirm that you want to upload this image and share it in this chat room.")}
                    </div>

                    <img
                        src={self.state.pasteImageConfirmDialog[2]}
                        style={{
                            maxWidth: "90%",
                            height: "auto",
                            maxHeight: $(document).outerHeight() * 0.3,
                            margin: '10px auto',
                            display: 'block',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                        onLoad={function(e) {
                            $(e.target).parents('.paste-image-chat').position({
                                of: $(document.body)
                            });
                        }}
                    />
                </div>
            </ModalDialogsUI.ConfirmDialog>
        }


        var confirmTruncateDialog = null;
        if (self.state.truncateDialog === true) {
            confirmDeleteDialog = <ModalDialogsUI.ConfirmDialog
                megaChat={room.megaChat}
                chatRoom={room}
                title={__(l[8871])}
                name="truncate-conversation"
                dontShowAgainCheckbox={false}
                onClose={() => {
                    self.setState({'truncateDialog': false});
                }}
                onConfirmClicked={() => {
                    self.scrolledToBottom = true;

                    room.truncate();

                    self.setState({
                        'truncateDialog': false
                    });
                }}
            >
                <div className="fm-dialog-content">

                    <div className="dialog secondary-header">
                        {__(l[8881])}
                    </div>
                </div>
            </ModalDialogsUI.ConfirmDialog>
        }
        if (self.state.archiveDialog === true) {
            confirmDeleteDialog = <ModalDialogsUI.ConfirmDialog
                megaChat={room.megaChat}
                chatRoom={room}
                title={__(l[19068])}
                name="archive-conversation"
                onClose={() => {
                    self.setState({'archiveDialog': false});
                }}
                onConfirmClicked={() => {
                    self.scrolledToBottom = true;

                    room.archive();

                    self.setState({
                        'archiveDialog': false
                    });
                }}
            >
                <div className="fm-dialog-content">

                    <div className="dialog secondary-header">
                        {__(l[19069])}
                    </div>
                </div>
            </ModalDialogsUI.ConfirmDialog>
        }
        if (self.state.unarchiveDialog === true) {
            confirmDeleteDialog = <ModalDialogsUI.ConfirmDialog
                megaChat={room.megaChat}
                chatRoom={room}
                title={__(l[19063])}
                name="unarchive-conversation"
                onClose={() => {
                    self.setState({'unarchiveDialog': false});
                }}
                onConfirmClicked={() => {
                    self.scrolledToBottom = true;

                    room.unarchive();

                    self.setState({
                        'unarchiveDialog': false
                    });
                }}
            >
                <div className="fm-dialog-content">

                    <div className="dialog secondary-header">
                        {__(l[19064])}
                    </div>
                </div>
            </ModalDialogsUI.ConfirmDialog>
        }
        if (self.state.renameDialog === true) {
            var onEditSubmit = function(e) {
                if ($.trim(self.state.renameDialogValue).length > 0 &&
                    self.state.renameDialogValue !== self.props.chatRoom.getRoomTitle()
                ) {
                    self.scrolledToBottom = true;

                    var participants = self.props.chatRoom.protocolHandler.getTrackedParticipants();
                    var promises = [];
                    promises.push(
                        ChatdIntegration._ensureKeysAreLoaded(undefined, participants)
                    );
                    var _runUpdateTopic = function() {
                        // self.state.value
                        var newTopic = self.state.renameDialogValue;
                        var topic = self.props.chatRoom.protocolHandler.embeddedEncryptTo
                                            (newTopic,
                                             strongvelope.MESSAGE_TYPES.TOPIC_CHANGE,
                                             participants);
                        if (topic) {
                            asyncApiReq({
                                "a":"mcst",
                                "id":self.props.chatRoom.chatId,
                                "ct":base64urlencode(topic),
                                "v": Chatd.VERSION
                            });
                        }
                    };
                    MegaPromise.allDone(promises).done(
                        function () {
                            _runUpdateTopic();
                        }
                    );
                    self.setState({'renameDialog': false, 'renameDialogValue': undefined});
                }
                e.preventDefault();
                e.stopPropagation();
            };

            confirmDeleteDialog = <ModalDialogsUI.ModalDialog
                megaChat={room.megaChat}
                chatRoom={room}
                title={__(l[9080])}
                name="rename-group"
                className="chat-rename-dialog"
                onClose={() => {
                    self.setState({'renameDialog': false, 'renameDialogValue': undefined});
                }}
                buttons={[
                    {
                        "label": l[61],
                        "key": "rename",
                        "className": (
                            $.trim(self.state.renameDialogValue).length === 0 ||
                            self.state.renameDialogValue === self.props.chatRoom.getRoomTitle() ?
                                "disabled" : ""
                        ),
                        "onClick": function(e) {
                            onEditSubmit(e);
                        }
                    },
                    {
                        "label": l[1686],
                        "key": "cancel",
                        "onClick": function(e) {
                            self.setState({'renameDialog': false, 'renameDialogValue': undefined});
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    },
                ]}>
                <div className="fm-dialog-content">

                    <div className="dialog secondary-header">
                        <div className="rename-input-bl">
                            <input type="text" name="newTopic"
                                   defaultValue={self.props.chatRoom.getRoomTitle()}
                                   value={self.state.renameDialogValue}
                                   maxLength="30"
                                   onChange={(e) => {
                                self.setState({'renameDialogValue': e.target.value.substr(0, 30)});
                            }} onKeyUp={(e) => {
                                if (e.which === 13) {
                                    onEditSubmit(e);
                                }
                            }} />
                        </div>
                    </div>
                </div>
            </ModalDialogsUI.ModalDialog>
        }

        var additionalClass = "";
        if (
            additionalClass.length === 0 &&
            self.state.messagesToggledInCall &&
            room.callManagerCall &&
            room.callManagerCall.isActive()
        ) {
            additionalClass = " small-block";
        }

        var myPresence = room.megaChat.userPresenceToCssClass(M.u[u_handle].presence);

        return (
            <div className={conversationPanelClasses} onMouseMove={self.onMouseMove}
                 data-room-id={self.props.chatRoom.chatId}>
                <div className="chat-content-block">
                    <ConversationRightArea
                        chatRoom={this.props.chatRoom}
                        members={this.props.chatRoom.members}
                        contacts={self.props.contacts}
                        megaChat={this.props.chatRoom.megaChat}
                        messagesBuff={room.messagesBuff}
                        onAttachFromComputerClicked={function() {
                            self.uploadFromComputer();
                        }}
                        onTruncateClicked={function() {
                            self.setState({'truncateDialog': true});
                        }}
                        onArchiveClicked={function() {
                            self.setState({'archiveDialog': true});
                        }}
                        onUnarchiveClicked={function() {
                            self.setState({'unarchiveDialog': true});
                        }}
                        onRenameClicked={function() {
                            self.setState({
                                'renameDialog': true,
                                'renameDialogValue': self.props.chatRoom.getRoomTitle()
                            });
                        }}
                        onLeaveClicked={function() {
                            room.leave(true);
                        }}
                        onCloseClicked={function() {
                            room.destroy();
                        }}
                        onAttachFromCloudClicked={function() {
                            self.setState({'attachCloudDialog': true});
                        }}
                        onAddParticipantSelected={function(contactHashes) {
                            self.scrolledToBottom = true;

                            if (self.props.chatRoom.type == "private") {
                                var megaChat = self.props.chatRoom.megaChat;

                                loadingDialog.show();

                                megaChat.trigger(
                                    'onNewGroupChatRequest',
                                    [
                                        self.props.chatRoom.getParticipantsExceptMe().concat(
                                            contactHashes
                                        )
                                    ]
                                );
                            }
                            else {
                                self.props.chatRoom.trigger('onAddUserRequest', [contactHashes]);
                            }
                        }}
                    />
                    <ConversationAudioVideoPanel
                        chatRoom={this.props.chatRoom}
                        contacts={self.props.contacts}
                        megaChat={this.props.chatRoom.megaChat}
                        unreadCount={this.props.chatRoom.messagesBuff.getUnreadCount()}
                        onMessagesToggle={function(isActive) {
                            self.setState({
                                'messagesToggledInCall': isActive
                            });
                        }}
                    />

                    {attachCloudDialog}
                    {sendContactDialog}
                    {confirmDeleteDialog}
                    {confirmTruncateDialog}


                    <div className="dropdown body dropdown-arrow down-arrow tooltip not-sent-notification hidden">
                        <i className="dropdown-white-arrow"></i>
                        <div className="dropdown notification-text">
                            <i className="small-icon conversations"></i>
                            {__(l[8882])}
                        </div>
                    </div>

                    <div className=
                            "dropdown body dropdown-arrow down-arrow tooltip not-sent-notification-manual hidden">
                        <i className="dropdown-white-arrow"></i>
                        <div className="dropdown notification-text">
                            <i className="small-icon conversations"></i>
                            {__(l[8883])}
                        </div>
                    </div>

                    <div className=
                            "dropdown body dropdown-arrow down-arrow tooltip not-sent-notification-cancel hidden">
                        <i className="dropdown-white-arrow"></i>
                        <div className="dropdown notification-text">
                            <i className="small-icon conversations"></i>
                            {__(l[8884])}
                        </div>
                    </div>

                    {
                        self.props.chatRoom.type === "group" ?
                            <div className="chat-topic-block">
                                <utils.EmojiFormattedContent>{
                                    self.props.chatRoom.getRoomTitle()
                                }</utils.EmojiFormattedContent>
                            </div> :
                            undefined
                    }
                    <div className={"messages-block " + additionalClass}>
                        <div className="messages scroll-area">
                            <PerfectScrollbar
                                   onFirstInit={(ps, node) => {
                                        ps.scrollToBottom(true);
                                        self.props.chatRoom.scrolledToBottom = self.scrolledToBottom = 1;

                                    }}
                                   onReinitialise={self.onMessagesScrollReinitialise}
                                   onUserScroll={self.onMessagesScrollUserScroll}
                                   className="js-messages-scroll-area perfectScrollbarContainer"
                                   messagesToggledInCall={self.state.messagesToggledInCall}
                                   ref={(ref) => self.messagesListScrollable = ref}
                                   chatRoom={self.props.chatRoom}
                                   messagesBuff={self.props.chatRoom.messagesBuff}
                                   editDomElement={self.state.editDomElement}
                                   editingMessageId={self.state.editing}
                                   confirmDeleteDialog={self.state.confirmDeleteDialog}
                                   renderedMessagesCount={messagesList.length}
                                >
                                <div className="messages main-pad">
                                    <div className="messages content-area">
                                        <div className="loading-spinner js-messages-loading light manual-management"
                                         key="loadingSpinner" style={{top: "50%"}}>
                                            <div className="main-loader" style={{
                                                'position': 'fixed',
                                                'top': '50%',
                                                'left': '50%'
                                            }}></div>
                                        </div>
                                        {/* add a naive pre-pusher that would eventually keep the the scrollbar
                                        realistic */}
                                        {messagesList}
                                    </div>
                                </div>
                            </PerfectScrollbar>
                        </div>

                        <div className="chat-textarea-block">
                            <WhosTyping chatRoom={room} />

                            <TypingAreaUI.TypingArea
                                chatRoom={self.props.chatRoom}
                                className="main-typing-area"
                                disabled={room.isReadOnly()}
                                persist={true}
                                onUpEditPressed={() => {
                                    var foundMessage = false;
                                    room.messagesBuff.messages.keys().reverse().some(function(k) {
                                        if(!foundMessage) {
                                            var message = room.messagesBuff.messages[k];

                                            var contact;
                                            if (message.userId) {
                                                if (!M.u[message.userId]) {
                                                    // data is still loading!
                                                    return;
                                                }
                                                contact = M.u[message.userId];
                                            }
                                            else {
                                                // contact not found
                                                return;
                                            }

                                            if (
                                                    contact && contact.u === u_handle &&
                                                    (unixtime() - message.delay) < MESSAGE_NOT_EDITABLE_TIMEOUT &&
                                                    !message.requiresManualRetry &&
                                                    !message.deleted &&
                                                    (!message.type ||
                                                         message instanceof Message) &&
                                                    (!message.isManagement || !message.isManagement())
                                                ) {
                                                    foundMessage = message;
                                                    return foundMessage;
                                            }
                                        }
                                    });

                                    if (!foundMessage) {
                                        return false;
                                    }
                                    else {
                                        self.setState({'editing': foundMessage.messageId});
                                        self.lastScrolledToBottom = false;
                                        return true;
                                    }
                                }}
                                onResized={() => {
                                    self.handleWindowResize();
                                    $('.js-messages-scroll-area', self.findDOMNode()).trigger('forceResize', [true]);
                                }}
                                onConfirm={(messageContents) => {
                                    if (messageContents && messageContents.length > 0) {
                                        if (!self.scrolledToBottom) {
                                            self.scrolledToBottom = true;
                                            self.lastScrollPosition = 0;
                                            // tons of hacks required because of the super weird continuous native
                                            // scroll event under Chrome + OSX, e.g. when the user scrolls up to the
                                            // start of the chat, the event continues to be received event that the
                                            // scrollTop is now 0..and if in that time the user sends a message
                                            // the event triggers a weird "scroll up" animation out of nowhere...
                                            $(self.props.chatRoom).bind('onMessagesBuffAppend.pull', function() {
                                                self.messagesListScrollable.scrollToBottom(false);
                                                setTimeout(function() {
                                                    self.messagesListScrollable.enable();
                                                }, 1500);
                                            });

                                            self.props.chatRoom.sendMessage(messageContents);
                                            self.messagesListScrollable.disable();
                                            self.messagesListScrollable.scrollToBottom(true);
                                        }
                                        else {
                                            self.props.chatRoom.sendMessage(messageContents);
                                        }
                                    }
                                }}
                            >
                                    <ButtonsUI.Button
                                        className="popup-button"
                                        icon="small-icon grey-medium-plus"
                                        disabled={room.isReadOnly()}
                                        >
                                        <DropdownsUI.Dropdown
                                            className="wide-dropdown attach-to-chat-popup"
                                            vertOffset={10}
                                        >
                                            <DropdownsUI.DropdownItem
                                                icon="grey-cloud"
                                                label={__(l[8011])}
                                                onClick={(e) => {
                                                    self.setState({'attachCloudDialog': true});
                                            }} />
                                            <DropdownsUI.DropdownItem
                                                icon="grey-computer"
                                                label={__(l[8014])}
                                                onClick={(e) => {
                                                    self.uploadFromComputer();
                                            }} />
                                            <DropdownsUI.DropdownItem
                                                icon="square-profile"
                                                label={__(l[8628])}
                                                onClick={(e) => {
                                                    self.setState({'sendContactDialog': true});
                                            }} />
                                        </DropdownsUI.Dropdown>
                                    </ButtonsUI.Button>
                            </TypingAreaUI.TypingArea>

                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

var ConversationPanels = React.createClass({
    mixins: [MegaRenderMixin, RenderDebugger],
    render: function() {
        var self = this;

        var conversations = [];

        var hadLoaded = (
            ChatdIntegration.allChatsHadLoaded.state() !== 'pending' &&
            ChatdIntegration.mcfHasFinishedPromise.state() !== 'pending' &&
            Object.keys(ChatdIntegration._loadingChats).length === 0
        );

        if (hadLoaded && getSitePath() === "/fm/chat") {
            // do we need to "activate" an conversation?
            var activeFound = false;
            self.props.conversations.forEach(function (chatRoom) {
                if (chatRoom.isCurrentlyActive) {
                    activeFound = true;
                }
            });
            if (self.props.conversations.length > 0 && !activeFound) {
                self.props.megaChat.showLastActive();
            }
        }

        hadLoaded && self.props.conversations.forEach(function(chatRoom) {
            var otherParticipants = chatRoom.getParticipantsExceptMe();

            var contact;
            if (otherParticipants && otherParticipants.length > 0) {
                contact = M.u[otherParticipants[0]];
            }

            conversations.push(
                <ConversationPanel
                    chatRoom={chatRoom}
                    isActive={chatRoom.isCurrentlyActive}
                    messagesBuff={chatRoom.messagesBuff}
                    contacts={M.u}
                    contact={contact}
                    key={chatRoom.roomId + "_" + chatRoom.instanceIndex}
                    />
            );
        });

        if (conversations.length === 0) {
            var contactsList = [];
            var contactsListOffline = [];

            if (hadLoaded) {
                self.props.contacts.forEach(function (contact) {
                    if (contact.u === u_handle) {
                        return;
                    }
                    if(contact.c === 1) {
                        var pres = self.props.megaChat.userPresenceToCssClass(contact.presence);

                        (pres === "offline" ? contactsListOffline : contactsList).push(
                            <ContactsUI.ContactCard contact={contact} megaChat={self.props.megaChat}
                                                    key={contact.u}/>
                        );
                    }
                });
            }
            var emptyMessage = hadLoaded ?
                l[8008] :
                l[7006];

            return (
                <div>
                    <div className="chat-right-area">
                        <div className="chat-right-area contacts-list-scroll">
                            <div className="chat-right-pad">
                                {contactsList}
                                {contactsListOffline}
                            </div>
                        </div>
                    </div>
                    <div className="empty-block">
                        <div className="empty-pad conversations">
                            <div className="empty-icon conversations"></div>
                            <div className="empty-title" dangerouslySetInnerHTML={{
                                __html: __(emptyMessage)
                                    .replace("[P]", "<span>")
                                    .replace("[/P]", "</span>")
                            }}></div>
                        </div>
                    </div>
                </div>
            );
        }
        else {
            return (
                <div className={"conversation-panels " + self.props.className}>
                    {conversations}
                </div>
            );
        }
    }
});



module.exports = {
    ConversationPanel,
    ConversationPanels
};
