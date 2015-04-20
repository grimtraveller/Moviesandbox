

#include "assignButton.h"
#include "renderer.h"
#include "input.h"

AssignButton::AssignButton(){}
AssignButton::~AssignButton(){}


void AssignButton::setup(){
    BasicButton::setup();

}

void AssignButton::update(double deltaTime){

    BasicButton::update(deltaTime);
}

void AssignButton::mouseOver(){

    BasicButton::mouseOver();

    //TODO:this is mainly used by LayerInspector, but might be useful somewhere else?
        Actor* myActor=readActor( (char*) buttonProperty.c_str() );
        if (myActor)
            myActor->bHighlight=true;

}

void AssignButton::mouseDrag(){

    input->dragButton=this;
    if (bConfineDragX)
        setLocation(Vector3f(input->mouseX-scale.x/2.0, location.y,0));
    else if (bConfineDragY)
        setLocation(Vector3f(location.x, input->mouseY-scale.y/2.0,0));
    else
        setLocation(Vector3f(input->mouseX-scale.x/2.0, input->mouseY-scale.y/2.0,0));

    if (bTriggerWhileDragging && parent)
        parent->trigger(this);
}

void AssignButton::finishDrag(){

    if (parent)
      parent->trigger(this);

    if (bResetAfterDrag)
        setLocation(initialLocation);
    cout << "setting to: " << initialLocation << endl;
    input->dragButton=NULL;

}

void AssignButton::clickedLeft(){

if (parent!=NULL)
  parent->trigger(this);
}

void AssignButton::clickedRight(){}

void AssignButton::focusClick(){

BasicButton::focusClick();
}

void AssignButton::deselect(int depth){

BasicButton::deselect(depth);
}

void AssignButton::create(){sceneData->addButton(this);}
