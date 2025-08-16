import React, { useState } from 'react';
import { CheckCircle, XCircle, MessageSquare, Calendar, User, Clock, AlertTriangle, Send, X } from 'lucide-react';
import { formatDate, getRelativeDate } from '../../utils/dateUtils';
import { getRoleDisplayName } from '../../utils/auth';

interface LeaveApprovalModalProps {
  request: any;
  requester: any;
  onApprove: (requestId: string, comments: string) => void;
  onReject: (requestId: string, comments: string) => void;
  onClose: () => void;
}

const LeaveApprovalModal: React.FC<LeaveApprovalModalProps> = ({
  request,
  requester,
  onApprove,
  onReject,
  onClose
}) => {
  const [comments, setComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const daysDifference = Math.ceil(
    (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 3600 * 24)
  ) + 1;

  const handleApprove = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      onApprove(request.id, comments);
      setIsProcessing(false);
    }, 1000);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      onReject(request.id, comments);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Manager Leave Approval</h3>
                <p className="text-purple-100 mt-1">Review and approve manager leave request</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Manager Information */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center space-x-4">
              <img
                src={requester.avatar}
                alt={requester.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-lg"
              />
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-gray-900">{requester.name}</h4>
                <p className="text-lg text-gray-600 font-medium">{getRoleDisplayName(requester.role)}</p>
                <p className="text-sm text-gray-500 capitalize">{requester.department.replace('_', ' ')} Department</p>
              </div>
              <div className="text-right">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <p className="text-sm text-gray-600">Leave Balance</p>
                  <p className="text-3xl font-bold text-blue-600">{requester.leaveBalance}</p>
                  <p className="text-xs text-gray-500">days remaining</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h5 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Leave Details</span>
              </h5>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Leave Type</p>
                  <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium capitalize">
                    {request.type.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-xl font-bold text-gray-900">{daysDifference} day{daysDifference > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dates</p>
                  <p className="font-bold text-gray-900">
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h5 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span>Request Information</span>
              </h5>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p className="font-bold text-gray-900">{getRelativeDate(request.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
                    PENDING APPROVAL
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="font-bold text-gray-900">
                    {request.type === 'emergency' ? 'High' : 'Normal'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <h5 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-yellow-600" />
              <span>Reason for Leave</span>
            </h5>
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <p className="text-gray-700 leading-relaxed">{request.reason}</p>
            </div>
          </div>

          {/* Director Comments */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Director Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="Add any comments for the manager..."
            />
          </div>

          {/* Impact Assessment */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h5 className="font-bold text-blue-900 mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <span>Impact Assessment</span>
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Team Impact</p>
                <p className="text-lg font-bold text-blue-900">Medium</p>
                <p className="text-xs text-blue-700">Manager absence affects team coordination</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Project Impact</p>
                <p className="text-lg font-bold text-blue-900">Low</p>
                <p className="text-xs text-blue-700">No critical deadlines during period</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Coverage</p>
                <p className="text-lg font-bold text-blue-900">Available</p>
                <p className="text-xs text-blue-700">Team leads can provide coverage</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-8 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-4">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  <span>Approve Leave Request</span>
                </>
              )}
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-bold flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6" />
                  <span>Reject Request</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveApprovalModal;