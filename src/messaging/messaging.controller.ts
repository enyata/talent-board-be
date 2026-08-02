import asyncHandler from "@src/middlewares/asyncHandler";
import { Request, Response } from "express";
import {
  ListConversationMessagesDto,
  ListConversationThreadsDto,
} from "./schemas/conversation.schema";
import { ListMessageRequestsDto } from "./schemas/messageRequest.schema";
import { ConversationService } from "./services/conversation.service";
import { MessageRequestService } from "./services/messageRequest.service";

const messageRequestService = new MessageRequestService();
const conversationService = new ConversationService();

export const acceptMessageRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await messageRequestService.acceptMessageRequest(
      req.user.id,
      req.params.requestId,
    );

    res.status(200).json({
      status: "success",
      message: "Message request accepted successfully",
      data: result,
    });
  },
);

export const createMessageRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const request = await messageRequestService.createMessageRequest(
      req.user.id,
      req.body,
    );

    res.status(201).json({
      status: "success",
      message: "Message request sent successfully",
      data: { request },
    });
  },
);

export const declineMessageRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const request = await messageRequestService.declineMessageRequest(
      req.user.id,
      req.params.requestId,
    );

    res.status(200).json({
      status: "success",
      message: "Message request declined successfully",
      data: { request },
    });
  },
);

export const getIncomingMessageRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await messageRequestService.getIncomingRequests(
      req.user.id,
      req.query as ListMessageRequestsDto,
    );

    res.status(200).json({
      status: "success",
      message: "Incoming message requests fetched successfully",
      data: result,
    });
  },
);

export const getConversationInbox = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await conversationService.getInbox(
      req.user.id,
      req.user.role,
      req.query as ListConversationThreadsDto,
    );

    res.status(200).json({
      status: "success",
      message: "Conversation inbox fetched successfully",
      data: result,
    });
  },
);

export const getConversationMessages = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await conversationService.getMessages(
      req.user.id,
      req.params.threadId,
      req.query as ListConversationMessagesDto,
    );

    res.status(200).json({
      status: "success",
      message: "Conversation messages fetched successfully",
      data: result,
    });
  },
);

export const getOutgoingMessageRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await messageRequestService.getOutgoingRequests(
      req.user.id,
      req.query as ListMessageRequestsDto,
    );

    res.status(200).json({
      status: "success",
      message: "Outgoing message requests fetched successfully",
      data: result,
    });
  },
);

export const sendConversationMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await conversationService.sendMessage(
      req.user.id,
      req.params.threadId,
      req.body,
    );

    res.status(201).json({
      status: "success",
      message: "Message sent successfully",
      data: result,
    });
  },
);
