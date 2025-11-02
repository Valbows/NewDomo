# 🧪 Manual Testing Guide - Tavus Objectives System

This guide walks you through manually testing the objectives system with real Tavus conversations.

## 🚀 Quick Start

### Step 1: Set Up Objectives
```bash
# Create objectives in Tavus
TAVUS_API_KEY=44bc5f162b174fe5b3ce8d92b4565551 npx tsx scripts/setup-objectives.ts
```

This will output objectives IDs like:
```
Demo Objectives ID: o123456789
Qualification Objectives ID: o987654321
```

### Step 2: Create Test Personas
```bash
# Create personas with objectives
TAVUS_API_KEY=44bc5f162b174fe5b3ce8d92b4565551 npx tsx examples/create-persona-with-objectives.ts
```

This will create personas with structured conversation flows.

## 🎯 Manual Testing Scenarios

### Test 1: Product Demo Flow

**Objective**: Test the complete product demo conversation flow

**Setup**:
1. Use the Demo Objectives ID from Step 1
2. Create a persona with demo objectives
3. Start a conversation with the persona

**Expected Flow**:
```
1. welcome_and_qualify
   → Agent asks: name, company, role, use case, interests
   → Collects: user_name, company_name, role, company_size, primary_use_case, key_interests

2. Conditional branching based on response:
   → show_overview_demo (if general interest)
   → show_specific_feature (if specific feature mentioned)  
   → address_pain_points (if challenges mentioned)

3. feature_deep_dive
   → Shows 2-3 relevant videos
   → Collects: features_shown, engagement_level, key_questions_asked

4. handle_objections
   → Addresses concerns
   → Collects: objections_raised, objections_resolved, comfort_level

5. show_social_proof (if needed)
   → Shares case studies
   → Collects: social_proof_shared, confidence_level

6. discuss_next_steps
   → Suggests trial/sales meeting
   → Collects: next_step_preference, timeline, decision_makers, urgency_level

7. capture_contact_info (manual confirmation)
   → Gets contact details
   → Collects: email, phone, preferred_contact_method, best_time_to_contact

8. complete_demo
   → Summarizes and provides CTA
   → Collects: demo_summary, resources_provided, satisfaction_level
```

**Test Script**:
```
You: "Hi, I'm interested in learning about your product"
Expected: Agent asks for name, company, role, and what you're interested in

You: "I'm John from Acme Corp, I'm a marketing manager looking for analytics tools"
Expected: Agent moves to show_overview_demo or show_specific_feature

You: "Can you show me the analytics dashboard?"
Expected: Agent shows specific feature video and asks follow-up questions

You: "That looks good, but I'm concerned about the price"
Expected: Agent moves to handle_objections and addresses pricing concerns

You: "Do you have any customer success stories?"
Expected: Agent moves to show_social_proof and shares case studies

You: "I'd like to try this out"
Expected: Agent moves to discuss_next_steps and suggests trial signup

You: "Yes, I want to start a trial"
Expected: Agent moves to capture_contact_info and asks for email/phone
```

### Test 2: Lead Qualification Flow

**Objective**: Test BANT qualification methodology

**Expected Flow**:
```
1. initial_greeting
   → Understands trigger event
   → Collects: trigger_event, immediate_need

2. qualify_company_fit  
   → Assesses ICP fit
   → Collects: company_size, industry, current_tools, team_size, fit_score

3. Conditional branching:
   → qualify_budget_authority (if good fit)
   → provide_alternative_resources (if poor fit)

4. qualify_budget_authority
   → BANT qualification
   → Collects: budget_range, decision_makers, evaluation_timeline, authority_level

5. Final branching:
   → schedule_full_demo (if qualified)
   → nurture_lead (if needs development)

6. capture_scheduling_info (manual confirmation)
   → Demo scheduling details
   → Collects: contact_info, scheduling_preferences, demo_requirements

7. complete_qualification
   → Confirms next steps
   → Collects: next_steps_confirmed, expectations_set
```

**Test Script**:
```
You: "I saw your ad and wanted to learn more"
Expected: Agent asks what brought you here and your immediate need

You: "We're a 50-person SaaS company struggling with customer analytics"
Expected: Agent assesses company fit and asks about current tools

You: "We use Google Analytics but need something more advanced"
Expected: Agent determines good fit and moves to budget qualification

You: "We have a $10k budget and I'm the decision maker"
Expected: Agent qualifies budget/authority and offers to schedule demo

You: "Yes, I'd like a demo next week"
Expected: Agent moves to capture scheduling info (manual confirmation step)
```

### Test 3: Customer Support Flow

**Objective**: Test customer onboarding and support

**Expected Flow**:
```
1. welcome_new_customer
   → Understands use case and goals
   → Collects: use_case, team_size, primary_goals, experience_level

2. account_setup_guidance (manual confirmation)
   → Guides through setup
   → Collects: setup_completed, team_invited, configuration_understood

3. core_feature_training
   → Provides hands-on training
   → Collects: features_learned, competency_level, immediate_value_achieved

4. Conditional branching:
   → advanced_feature_training (if comfortable)
   → additional_core_practice (if needs more help)

5. success_metrics_setup
   → Sets up tracking
   → Collects: success_metrics_defined, reporting_setup, roi_tracking

6. ongoing_support_resources
   → Provides resources and follow-up
   → Collects: resources_provided, support_channels_understood, follow_up_scheduled
```

## 🔍 What to Look For

### ✅ Successful Objective Completion
- Agent follows the exact sequence defined in objectives
- Agent collects all specified output variables
- Conditional branching works based on user responses
- Manual confirmation steps pause for user input

### ✅ Data Collection
- Each objective captures the defined variables
- Variables are used in subsequent objectives
- Agent remembers context from previous objectives

### ✅ Flow Control
- Agent doesn't skip objectives inappropriately
- Conditional logic works correctly
- No circular loops or infinite branching

### ❌ Common Issues to Watch For
- Agent skips objectives or goes out of order
- Agent doesn't collect required variables
- Conditional branching doesn't work
- Agent gets stuck in loops
- Manual confirmation steps don't pause properly

## 🛠️ Debugging Tips

### Check Objective Completion
Monitor the conversation for objective completion events. You should see:
- Clear progression through each objective
- Collection of specified variables
- Appropriate branching based on conditions

### Verify Variable Collection
The agent should reference collected information:
```
"Based on what you told me about your company size (50 people)..."
"Since you mentioned your budget is $10k..."
"Given your interest in analytics tools..."
```

### Test Edge Cases
- What happens if user gives unexpected responses?
- Does agent handle objections gracefully?
- Can user interrupt the flow and resume?
- Does agent recover from errors?

## 📊 Success Metrics

### Conversation Quality
- [ ] Agent follows structured flow
- [ ] All objectives completed in order
- [ ] Required variables collected
- [ ] Appropriate branching occurs

### User Experience  
- [ ] Conversation feels natural
- [ ] Agent doesn't feel robotic or scripted
- [ ] User can interrupt and ask questions
- [ ] Flow adapts to user responses

### Business Outcomes
- [ ] Qualification data captured
- [ ] Next steps clearly defined
- [ ] Contact information collected
- [ ] Appropriate follow-up scheduled

## 🚨 Troubleshooting

### Agent Not Following Objectives
1. Check that objectives_id was properly attached to persona
2. Verify objectives were created successfully in Tavus
3. Ensure no circular dependencies in objective flow

### Missing Variable Collection
1. Check objective definitions include output_variables
2. Verify agent is asking the right questions
3. Ensure variables are being used in subsequent objectives

### Branching Not Working
1. Verify conditional objectives exist in the template
2. Check condition descriptions are clear
3. Ensure referenced objectives are defined

### Manual Confirmation Issues
1. Check confirmation_mode is set to "manual"
2. Verify agent pauses for user confirmation
3. Ensure user can proceed after confirmation

## 📞 Getting Help

If you encounter issues:

1. **Check the logs** - Look for objective completion events
2. **Verify the setup** - Run the test suite to ensure everything is working
3. **Test with simple objectives** - Start with basic flows before complex ones
4. **Review the templates** - Ensure objective definitions are correct

## 🎯 Next Steps

Once manual testing is successful:

1. **Create custom objectives** for your specific business needs
2. **Monitor objective completion rates** to optimize flows  
3. **A/B test different conversation flows** to improve outcomes
4. **Integrate with your CRM** to capture collected variables
5. **Set up webhooks** to trigger actions on objective completion

---

**Happy Testing! 🚀**

The objectives system gives you powerful control over AI conversations while maintaining natural, engaging interactions.